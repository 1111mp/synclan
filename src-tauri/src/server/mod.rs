use crate::{
    logging,
    utils::{dirs, logging::Type},
};

use anyhow::Result;
use axum::Router;
use socketioxide::{handler::ConnectHandler, SocketIo};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    Pool, Sqlite,
};
use std::{net::SocketAddr, str::FromStr, sync::Arc};
use tower_http::services::ServeDir;

mod events;
mod routes;

pub async fn start_http_server() -> Result<()> {
    // sqlite db
    let db_dir = dirs::app_db_dir()?;
    let db_path = db_dir.join("server.db");
    let db_url = format!("sqlite://{}", db_path.to_string_lossy());
    let opts = SqliteConnectOptions::from_str(&db_url)?
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Full)
        .pragma("cipher", "sqlcipher")
        .pragma("legacy", "4")
        .pragma("key", whoami::username())
        .create_if_missing(true);
    let db_pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await?;

    logging!(
        info,
        Type::Server,
        true,
        "Successfully connected to the database"
    );

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
        .nest("api", routes::router())
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

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Pool<Sqlite>,
}
