use crate::{
    config::Config,
    logging, logging_error,
    process::AsyncHandler,
    utils::{db, dirs, logging::Type, tls},
};
use anyhow::{bail, Result};
use api_doc::ApiDoc;
use axum_server::Handle;
use parking_lot::Mutex;
use socketioxide::{handler::ConnectHandler, SocketIo};
use sqlx::{Pool, Sqlite};
use std::{
    net::{IpAddr, SocketAddr},
    sync::Arc,
};
use tower_http::services::ServeDir;
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

mod api_doc;
mod events;
mod routes;

// Global http server instance
pub static HTTP_SERVER: once_cell::sync::Lazy<HttpServer> =
    once_cell::sync::Lazy::new(|| HttpServer::new());

pub struct HttpServer {
    handle: Arc<Mutex<Option<Handle>>>,
}

impl HttpServer {
    pub fn new() -> Self {
        Self {
            handle: Arc::new(Mutex::new(None)),
        }
    }

    // start http server
    pub async fn start_http_server(&self, db_pool: Pool<Sqlite>) -> Result<()> {
        // stop the current server first (if any)
        self.shutdown().await;

        // start a new server
        let handle = Handle::new();
        let cloned_handle = handle.clone();

        // store the handle for later stopping
        *self.handle.lock() = Some(handle);

        self.bootstrap(cloned_handle, db_pool).await?;

        Ok(())
    }

    // start the entry of http server
    pub async fn bootstrap(&self, handle: Handle, db_pool: Pool<Sqlite>) -> Result<()> {
        let app_state = Arc::new(AppState { db_pool });

        // build our application with a single route
        let (router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
            .nest("/api", routes::router())
            .split_for_parts();

        let (layer, io) = SocketIo::builder()
            .with_state(events::store::Clients::default())
            .build_layer();
        io.ns(
            "/socket",
            events::handlers::on_connection.with(events::handlers::authenticate_middleware),
        );

        let resources = dirs::app_resources_dir()?;
        let web_static_dir = resources.join("web");

        let app = router
            // swagger ui
            .merge(SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", api))
            // web static server
            .fallback_service(ServeDir::new(web_static_dir))
            .layer(layer)
            .with_state(app_state);

        logging!(info, Type::Server, true, "Starting server...");

        let ip: IpAddr = "0.0.0.0".parse()?;
        let addr = SocketAddr::from((ip, 53317));

        let enable_encryption = Config::synclan().latest().enable_encryption;
        match enable_encryption {
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

        Ok(())
    }

    // gracefully shutdown http server
    pub async fn shutdown(&self) {
        if let Some(handle) = self.handle.lock().take() {
            handle.graceful_shutdown(None);
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
                HTTP_SERVER.start_http_server(db_pool).await
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

    match HTTP_SERVER.start_http_server(db_pool).await {
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
}
