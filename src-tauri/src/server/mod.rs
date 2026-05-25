use crate::{
    config::Config,
    feat, logging, logging_error,
    module::message::{Message, MessageJob},
    process::AsyncHandler,
    utils::{db, dirs, logging::Type, tls},
};
use anyhow::{bail, Result};
use apalis::{
    layers::{
        retry::{
            backoff::{ExponentialBackoffMaker, MakeBackoff},
            HasherRng, RetryPolicy,
        },
        ErrorHandlingLayer, WorkerBuilderExt,
    },
    prelude::{Event, Monitor, WorkerBuilder, WorkerFactoryFn},
};
use apalis_sql::sqlite::SqliteStorage;
use api_doc::ApiDoc;
use axum::{handler::HandlerWithoutStateExt, http::StatusCode};
use axum_server::Handle;
use futures::FutureExt;
use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use socketioxide::{handler::ConnectHandler, SocketIo};
use sqlx::{Pool, Sqlite};
use std::{
    net::{IpAddr, SocketAddr},
    sync::Arc,
    time::Duration,
};
use tokio::{sync::oneshot, time::timeout};
use tokio_util::sync::CancellationToken;
use tower_http::services::ServeDir;
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

mod api_doc;
mod dtos;
pub mod events;
mod exception;
mod extractors;
mod guards;
mod routes;
mod status_code_serde;

pub struct HttpServer {
    handle: Arc<Mutex<Option<Handle<std::net::SocketAddr>>>>,
    monitor_token: Arc<Mutex<Option<CancellationToken>>>,
    shutdown_rx: Arc<Mutex<Option<oneshot::Receiver<()>>>>,
}

impl HttpServer {
    /// global instance
    pub fn global() -> &'static HttpServer {
        static INSTANCE: OnceCell<HttpServer> = OnceCell::new();
        INSTANCE.get_or_init(|| HttpServer::new())
    }

    pub fn new() -> Self {
        Self {
            handle: Arc::new(Mutex::new(None)),
            monitor_token: Arc::new(Mutex::new(None)),
            shutdown_rx: Arc::new(Mutex::new(None)),
        }
    }

    /// start http server
    pub async fn start_http_server(&self, db_pool: Pool<Sqlite>) -> Result<()> {
        // stop the current server first (if any)
        self.shutdown().await;

        // start a new server
        let handle = Handle::new();
        let cloned_handle = handle.clone();
        // store the handle for later stopping
        *self.handle.lock() = Some(handle);

        let token = CancellationToken::new();
        let cloned_token = token.clone();
        *self.monitor_token.lock() = Some(token);

        // automatically clear uploaded files
        feat::uploaded_files_auto_cleanup().await?;

        self.bootstrap(db_pool, cloned_handle, cloned_token).await?;

        Ok(())
    }

    /// the entry to start http server
    pub async fn bootstrap(
        &self,
        db_pool: Pool<Sqlite>,
        handle: Handle<std::net::SocketAddr>,
        token: CancellationToken,
    ) -> anyhow::Result<()> {
        let storage = SqliteStorage::<Message>::new(db_pool.clone());
        let app_state = Arc::new(AppState {
            db_pool,
            message_storage: storage.clone(),
        });

        // build our application with a single route
        let (router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
            .nest("/api", routes::router())
            .split_for_parts();

        let clients: events::store::Clients = events::store::Clients::default();
        let (layer, io) = SocketIo::builder()
            .with_state(app_state.clone())
            .with_state(clients.clone())
            .build_layer();
        io.ns(
            "/",
            events::handlers::on_connection.with(events::handlers::authenticate_middleware),
        );

        let resources = dirs::app_resources_dir()?;
        let web_static_dir = resources.join("web");
        let synclan = Config::synclan().latest_ref().clone();

        let mut app = router
            // swagger ui
            .merge(SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", api))
            // web static server
            .fallback_service(ServeDir::new(web_static_dir))
            .layer(layer)
            .with_state(app_state);

        if let Some(file_upload_dir) = synclan.file_upload_dir {
            // uploads files static server
            app = app.nest_service(
                "/uploads",
                ServeDir::new(file_upload_dir).not_found_service(
                    (async || (StatusCode::NOT_FOUND, "Not found")).into_service(),
                ),
            );
        }

        logging!(info, Type::Server, true, "Starting server...");

        let ip: IpAddr = "0.0.0.0".parse()?;
        let addr = SocketAddr::from((ip, 53317));

        let http = async {
            match synclan.enable_encryption {
                Some(true) | None => {
                    let config = tls::build_rustls_config_with_ip(&ip).await?;
                    logging!(info, Type::Server, true, "Listening on https://{}", addr);
                    axum_server::bind_rustls(addr, config)
                        .handle(handle)
                        .serve(app.into_make_service())
                        .await?;
                }
                Some(false) => {
                    logging!(info, Type::Server, true, "Listening on http://{}", addr);
                    axum_server::bind(addr)
                        .handle(handle)
                        .serve(app.into_make_service())
                        .await?;
                }
            };

            Ok::<(), anyhow::Error>(())
        };

        let message_job = Arc::new(MessageJob::new(io, clients));
        let monitor = async {
            Monitor::new()
                .register({
                    WorkerBuilder::new("synclan-tasty-message")
                        .layer(ErrorHandlingLayer::new())
                        .rate_limit(8, Duration::from_secs(1))
                        .timeout(Duration::from_secs(6))
                        .concurrency(4)
                        .retry(
                            RetryPolicy::retries(3).with_backoff(
                                ExponentialBackoffMaker::new(
                                    Duration::from_secs(2),
                                    Duration::from_secs(10),
                                    2.0,
                                    HasherRng::default(),
                                )?
                                .make_backoff(),
                            ),
                        )
                        .enable_tracing()
                        .backend(storage)
                        .build_fn(move |message| {
                            let message_job = message_job.clone();
                            async move { message_job.job_fn(message).await }
                        })
                })
                .on_event(|evt| {
                    let id = evt.id();
                    match evt.inner() {
                        Event::Start => {
                            logging!(info, Type::Server, true, "Worker {id} started");
                        }
                        Event::Error(e) => {
                            logging!(
                                info,
                                Type::Server,
                                true,
                                "Worker {id} encountered an error: {e}"
                            );
                        }
                        Event::Stop => {
                            logging!(info, Type::Server, true, "Worker {id} stopped");
                        }
                        Event::Exit => {
                            logging!(info, Type::Server, true, "Worker {id} exited");
                        }
                        _ => {}
                    }
                })
                .shutdown_timeout(Duration::from_millis(5000))
                .run_with_signal(token.cancelled().map(|_| Ok::<(), std::io::Error>(())))
                .await?;

            Ok::<(), anyhow::Error>(())
        };

        let (tx, rx) = oneshot::channel::<()>();
        *self.shutdown_rx.lock() = Some(rx);

        let (http_res, monitor_res) = tokio::join!(http, monitor);
        http_res?;
        monitor_res?;

        let _ = tx.send(());

        Ok(())
    }

    /// gracefully shutdown http server & worker
    pub async fn shutdown(&self) {
        if let Some(token) = self.monitor_token.lock().take() {
            token.cancel();
        }

        if let Some(handle) = self.handle.lock().take() {
            handle.graceful_shutdown(None);
        }

        let maybe_rx = { self.shutdown_rx.lock().take() };
        if let Some(rx) = maybe_rx {
            match timeout(Duration::from_secs(10), rx).await {
                Ok(Ok(())) => {
                    logging_error!(Type::Server, true, "{}", "Server shutdown completed");
                }
                Ok(Err(_)) => {
                    logging_error!(
                        Type::Server,
                        true,
                        "{}",
                        "Shutdown notifier sender was dropped"
                    );
                }
                Err(_) => {
                    logging_error!(
                        Type::Server,
                        true,
                        "{}",
                        "Timed out(10s) waiting server to shutdown"
                    );
                }
            }
        }
    }
}

/// Start the local http server
pub fn start_http_server() {
    logging!(info, Type::Server, true, "Start the local http server");
    if let Some(db_pool) = db::DBManager::global().db_pool() {
        AsyncHandler::spawn(move || async {
            logging_error!(
                Type::Server,
                true,
                HttpServer::global().start_http_server(db_pool).await
            );
        });
    } else {
        logging_error!(
            Type::Server,
            true,
            "{}",
            "SQLite connection pool has not been initialized"
        );
        logging_error!(
            Type::Server,
            true,
            "{}",
            "The local http server failed to start"
        );
    }
}

/// Restart the local http server
pub async fn restart_http_server() -> Result<()> {
    logging!(
        info,
        Type::Server,
        true,
        "Attempting to restart http server..."
    );
    let db_pool = match db::DBManager::global().db_pool() {
        Some(db_pool) => db_pool,
        None => {
            logging_error!(
                Type::Server,
                true,
                "{}",
                "Failed to restart: SQLite connection pool has not been initialized"
            );
            bail!("SQLite connection pool has not been initialized");
        }
    };

    match HttpServer::global().start_http_server(db_pool).await {
        Ok(()) => {
            logging!(
                info,
                Type::Server,
                true,
                "HTTP server restarted successfully"
            );
            Ok(())
        }
        Err(err) => {
            logging_error!(Type::Server, true, "HTTP server restart failed: {}", err);
            Err(err)
        }
    }
}

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Pool<Sqlite>,
    pub message_storage: SqliteStorage<Message>,
}
