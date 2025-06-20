use crate::{
    logging, logging_error,
    process::AsyncHandler,
    utils::{db, dirs, logging::Type},
};

use anyhow::Result;
use axum::Router;
use socketioxide::{handler::ConnectHandler, SocketIo};
use sqlx::{Pool, Sqlite};
use std::{net::SocketAddr, sync::Arc};
use tower_http::services::ServeDir;

mod events;
mod routes;

async fn bootstrap(db_pool: Pool<Sqlite>) -> Result<()> {
    let app_state = Arc::new(AppState { db_pool });

    let (layer, io) = SocketIo::builder()
        .with_state(events::store::Clients::default())
        .build_layer();
    io.ns(
        "/socket",
        events::handlers::on_connection.with(events::handlers::authenticate_middleware),
    );

    let resources = dirs::app_resources_dir()?;
    let web_static_dir = resources.join("web");
    let app = Router::new()
        .nest("/api", routes::router())
        // web static server
        .fallback_service(ServeDir::new(web_static_dir))
        .layer(layer)
        .with_state(app_state);

    logging!(info, Type::Server, true, "Starting server...");

    let addr = SocketAddr::from(([0, 0, 0, 0], 53317));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    logging!(
        info,
        Type::Server,
        true,
        "Listening on {}",
        listener.local_addr()?
    );

    axum::serve(listener, app).await?;

    Ok(())
}

/// Start the web http server
pub fn start_http_server() {
    logging!(info, Type::Server, true, "Start the Web http server");
    if let Some(db_pool) = db::DBManager::global().db_pool() {
        AsyncHandler::spawn(move || async {
            logging_error!(Type::Server, true, bootstrap(db_pool).await);
        });
    } else {
        logging_error!(
            Type::Server,
            true,
            "{}",
            "SQLite connection pool has not been initialized"
        );
        logging_error!(Type::Server, true, "{}", "Web http server failed to start");
    }
}

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Pool<Sqlite>,
}
