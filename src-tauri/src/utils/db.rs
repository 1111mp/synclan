use crate::{
    logging, logging_error, singleton,
    utils::{dirs, logging::Type},
};
use anyhow::{Result, anyhow};
use apalis_sqlite::SqliteStorage;
use sqlx::{
    Pool, Sqlite, migrate,
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
};
use std::{str::FromStr, sync::OnceLock};

/// database manager
pub struct DBManager {
    pub db_pool: OnceLock<Pool<Sqlite>>,
}

impl Default for DBManager {
    fn default() -> Self {
        Self {
            db_pool: OnceLock::new(),
        }
    }
}

singleton!(DBManager, DBMANAGER);

impl DBManager {
    fn new() -> Self {
        Self::default()
    }

    pub async fn init(&self) -> Result<()> {
        logging!(info, Type::Setup, "starting database initialization...");
        let db_dir = dirs::app_db_dir()?;
        if !db_dir.exists() {
            tokio::fs::create_dir_all(&db_dir).await?;
        }

        let db_path = db_dir.join("client.db");
        let db_url = format!("sqlite://{}", db_path.display());
        let opts = SqliteConnectOptions::from_str(&db_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Full)
            .pragma("cipher", "sqlcipher")
            .pragma("legacy", "4")
            .pragma("key", whoami::username()?)
            .create_if_missing(true);

        let db_pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(opts)
            .await?;

        logging!(
            info,
            Type::Setup,
            "Successfully connected to the client database"
        );

        // Run migrations
        let migration_dir = dirs::app_resources_dir()?.join("migrations");
        logging_error!(
            Type::Setup,
            migrate::Migrator::new(migration_dir)
                .await?
                .set_ignore_missing(true)
                .run(&db_pool)
                .await
        );
        logging_error!(Type::Server, SqliteStorage::setup(&db_pool).await);

        logging!(
            info,
            Type::Setup,
            "Successfully applied database migrations"
        );

        self.db_pool
            .set(db_pool)
            .map_err(|_| anyhow!("database already initialized"))?;

        Ok(())
    }

    pub fn db_pool(&self) -> Option<&Pool<Sqlite>> {
        self.db_pool.get()
    }
}

pub fn get_db_pool() -> Result<Pool<Sqlite>> {
    DBManager::global()
        .db_pool()
        .cloned()
        .ok_or_else(|| anyhow!("SQLite connection pool has not been initialized"))
}
