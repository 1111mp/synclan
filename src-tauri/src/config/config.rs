use crate::{logging, logging_error, process::AsyncHandler, utils::logging::Type};

use super::{Draft, ISynclan};
use tokio::sync::OnceCell;

pub struct Config {
    synclan_config: Draft<ISynclan>,
}

impl Config {
    pub async fn global() -> &'static Self {
        static CONFIG: OnceCell<Config> = OnceCell::const_new();
        CONFIG
            .get_or_init(|| async {
                Self {
                    synclan_config: Draft::new(ISynclan::new().await),
                }
            })
            .await
    }

    pub async fn synclan() -> Draft<ISynclan> {
        Self::global().await.synclan_config.clone()
    }

    pub async fn apply_all_and_save_file() {
        logging!(info, Type::Config, "save all draft data");

        let save_synclan_task = AsyncHandler::spawn(|| async {
            let synclan = Self::synclan().await;
            synclan.apply();
            logging_error!(Type::Config, synclan.data_arc().save_config().await);
        });

        let _ = tokio::join!(save_synclan_task);

        logging!(info, Type::Config, "save all draft data finished");
    }
}
