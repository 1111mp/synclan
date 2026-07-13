#![allow(unused)]

use crate::{
    config::Config,
    feat, logging, logging_error,
    process::AsyncHandler,
    server::{
        events::{handlers, store},
        workers::WorkerMonitor,
    },
    singleton,
    utils::{db, dirs, logging::Type, tls},
};
use anyhow::{Context, Result, anyhow};
use apalis::prelude::{BackoffConfig, IntervalStrategy, StrategyBuilder};
use apalis_sqlite::SqliteStorage;
use api_doc::ApiDoc;
use axum::{
    handler::HandlerWithoutStateExt,
    http::{Method, StatusCode, header},
};
use axum_server::Handle;
use parking_lot::Mutex;
use socketioxide::{SocketIo, handler::ConnectHandler, layer::SocketIoLayer};
use sqlx::{Pool, Sqlite};
use std::{
    net::{IpAddr, SocketAddr},
    sync::Arc,
    time::Duration,
};
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    services::{ServeDir, ServeFile},
};
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
mod workers;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Pool<Sqlite>,
    pub message_storage: workers::MessageBackend,
}

pub struct HttpServer {
    handle: Arc<Mutex<Option<Handle<std::net::SocketAddr>>>>,
    runtime_handle: Arc<Mutex<Option<tauri::async_runtime::JoinHandle<()>>>>,
}

impl Default for HttpServer {
    fn default() -> Self {
        Self {
            handle: Arc::new(Mutex::new(None)),
            runtime_handle: Arc::new(Mutex::new(None)),
        }
    }
}

singleton!(HttpServer, HTTPSERVER);

impl HttpServer {
    fn new() -> Self {
        Self::default()
    }

    /// start http server
    pub async fn start(&self, db_pool: &Pool<Sqlite>) -> Result<()> {
        // stop the current server first (if any)
        self.shutdown().await;

        // start a new server
        let handle = Handle::new();
        let cloned_handle = handle.clone();
        // store the handle for later stopping
        *self.handle.lock() = Some(handle);

        // automatically clear uploaded files
        feat::uploaded_files_auto_cleanup().await?;

        let db_pool_clone = db_pool.clone();
        let runtime_handle = AsyncHandler::spawn(|| async {
            logging_error!(Type::Server, Self::run(db_pool_clone, cloned_handle).await);
        });
        *self.runtime_handle.lock() = Some(runtime_handle);

        Ok(())
    }

    pub async fn run(
        // &self,
        db_pool: Pool<Sqlite>,
        handle: Handle<std::net::SocketAddr>,
    ) -> Result<()> {
        let config = &apalis_sqlite::Config::default()
            .with_poll_interval(
                StrategyBuilder::new()
                    .apply(
                        IntervalStrategy::new(Duration::from_millis(100)).with_backoff(
                            BackoffConfig::new(Duration::from_secs(2))
                                .with_multiplier(1.5)
                                .with_jitter(0.1),
                        ),
                    )
                    .build(),
            )
            .set_buffer_size(50);
        let mut message_backend = SqliteStorage::new_with_config(&db_pool, config);
        let app_state = Arc::new(AppState {
            db_pool,
            message_storage: message_backend.clone(),
        });

        let clients = store::Clients::default();
        let (layer, io) = SocketIo::builder()
            .with_state(app_state.clone())
            .with_state(clients.clone())
            .build_layer();
        io.ns(
            "/socket",
            handlers::on_connection.with(handlers::authenticate_middleware),
        );

        tokio::try_join!(
            Self::run_http_server(handle, app_state, layer),
            Self::run_backend_server(message_backend, io, clients),
        )?;

        Ok(())
    }

    async fn run_backend_server(
        // &self,
        message_backend: workers::MessageBackend,
        io: SocketIo,
        clients: store::Clients,
    ) -> Result<()> {
        WorkerMonitor::global().run(message_backend, io, clients).await
    }

    /// the entry to start http server
    async fn run_http_server(
        // &self,
        handle: Handle<std::net::SocketAddr>,
        app_state: Arc<AppState>,
        layer: SocketIoLayer,
        // token: CancellationToken,
    ) -> anyhow::Result<()> {
        // build our application with a single route
        let (router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
            .nest("/api", routes::router())
            .split_for_parts();

        let resources = dirs::app_resources_dir()?;
        let web_static_dir = resources.join("web");
        let synclan = Config::synclan().await.latest_arc();
        let static_server =
            ServeDir::new(&web_static_dir).not_found_service(ServeFile::new(web_static_dir.join("index.html")));

        let mut app = router
            // swagger ui
            .merge(SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", api))
            // web static server
            .fallback_service(static_server)
            .layer(layer)
            .layer(
                CorsLayer::new()
                    .allow_credentials(true)
                    .allow_headers([
                        header::ACCEPT,
                        header::ACCEPT_LANGUAGE,
                        header::AUTHORIZATION,
                        header::CONTENT_LANGUAGE,
                        header::CONTENT_TYPE,
                    ])
                    .allow_methods([
                        Method::GET,
                        Method::POST,
                        Method::PATCH,
                        Method::PUT,
                        Method::DELETE,
                        Method::HEAD,
                        Method::OPTIONS,
                    ])
                    .allow_origin(AllowOrigin::predicate(|origin, _request_parts| {
                        origin.as_bytes().starts_with(b"http://localhost")
                    }))
                    .max_age(Duration::from_secs(3600)),
            )
            .with_state(app_state);

        if let Some(file_upload_dir) = &synclan.file_upload_dir {
            // uploads files static server
            app = app.nest_service(
                "/attachments",
                ServeDir::new(file_upload_dir)
                    .not_found_service((async || (StatusCode::NOT_FOUND, "Not found")).into_service()),
            );
        }

        logging!(info, Type::Server, "Starting HTTP server...");

        let ip: IpAddr = "0.0.0.0".parse()?;
        let addr = SocketAddr::from((ip, 53317));

        match synclan.enable_encryption {
            Some(true) | None => {
                let config = tls::build_rustls_config_with_ip(&ip).await?;
                logging!(info, Type::Server, "HTTP server listening on https://{}", addr);
                axum_server::bind_rustls(addr, config)
                    .handle(handle)
                    .serve(app.into_make_service())
                    .await?;
            },
            Some(false) => {
                logging!(info, Type::Server, "HTTP server listening on http://{}", addr);
                axum_server::bind(addr)
                    .handle(handle)
                    .serve(app.into_make_service())
                    .await?;
            },
        };

        Ok(())
    }

    /// gracefully shutdown http server & worker
    pub async fn shutdown(&self) {
        logging!(info, Type::Server, "Shutting down HTTP server");

        WorkerMonitor::global().shutdown();

        if let Some(handle) = self.handle.lock().take() {
            handle.graceful_shutdown(Some(Duration::from_secs(5)));
        }

        let runtime_handle = self.runtime_handle.lock().take();
        if let Some(handle) = runtime_handle {
            // Wait for the runtime to finish, with a timeout to prevent hanging indefinitely.
            if tokio::time::timeout(Duration::from_millis(5500), handle).await.is_err() {
                logging!(
                    warn,
                    Type::Server,
                    "Graceful shutdown timed out! Forcing backend tasks to abort for safety."
                );
            }
        }

        logging!(info, Type::Server, "HTTP server shutdown successfully");
    }
}

/// Start the local http server
pub async fn start_http_server() -> Result<()> {
    logging!(info, Type::Server, "Start the local http server");
    let db_pool = db::DBManager::global()
        .db_pool()
        .with_context(|| anyhow!("SQLite connection pool has not been initialized"))?;
    HttpServer::global().start(db_pool).await?;
    logging!(info, Type::Server, "HTTP server started successfully");
    Ok(())
}

/// Restart the local http server
pub async fn restart_http_server() -> Result<()> {
    logging!(info, Type::Server, "Attempting to restart http server...");
    let db_pool = db::DBManager::global()
        .db_pool()
        .with_context(|| anyhow!("Failed to restart: SQLite connection pool has not been initialized"))?;
    HttpServer::global().start(db_pool).await?;
    logging!(info, Type::Server, "HTTP server restarted successfully");
    Ok(())
}
