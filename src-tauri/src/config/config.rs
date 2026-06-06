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
}
