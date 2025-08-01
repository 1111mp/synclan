use anyhow::{anyhow, Result};
use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use sqlx::{
    migrate,
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    Pool, Sqlite,
};
use std::{str::FromStr, sync::Arc};

use crate::{
    logging, logging_error,
    process::AsyncHandler,
    utils::{dirs, logging::Type},
};

/// database manager
pub struct DBManager {
    pub db_pool: Arc<RwLock<Option<Pool<Sqlite>>>>,
}

impl DBManager {
    pub fn global() -> &'static DBManager {
        static DB_MANAGER: OnceCell<DBManager> = OnceCell::new();
        DB_MANAGER.get_or_init(|| DBManager {
            db_pool: Arc::new(RwLock::new(None)),
        })
    }

    pub fn init(&self) -> Result<()> {
        logging!(
            info,
            Type::Setup,
            true,
            "starting database initialization..."
        );

        AsyncHandler::run_async_command(async move {
            let db_dir = dirs::app_db_dir()?;
            if !db_dir.exists() {
                std::fs::create_dir_all(&db_dir)?;
            }
            let db_path = db_dir.join("client.db");
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
                Type::Setup,
                true,
                "Successfully connected to the client database"
            );

            // Run migrations
            let migration_dir = dirs::app_resources_dir()?.join("migrations");
            logging_error!(
                Type::Setup,
                true,
                migrate::Migrator::new(migration_dir)
                    .await?
                    .run(&db_pool)
                    .await
            );

            logging!(
                info,
                Type::Setup,
                true,
                "Successfully applied database migrations"
            );

            let mut pool = self.db_pool.write();
            *pool = Some(db_pool);

            Ok(())
        })
    }

    pub fn db_pool(&self) -> Option<Pool<Sqlite>> {
        self.db_pool.read().clone()
    }
}

pub fn get_db_pool() -> Result<Pool<Sqlite>> {
    DBManager::global()
        .db_pool()
        .ok_or_else(|| anyhow!("SQLite connection pool has not been initialized"))
}
