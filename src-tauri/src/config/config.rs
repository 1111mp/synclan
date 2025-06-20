use super::{Draft, ISynclan};
use once_cell::sync::OnceCell;

pub struct Config {
    synclan_config: Draft<Box<ISynclan>>,
}

impl Config {
    pub fn global() -> &'static Config {
        static CONFIG: OnceCell<Config> = OnceCell::new();
        CONFIG.get_or_init(|| Config {
            synclan_config: Draft::from(Box::new(ISynclan::new())),
        })
    }

    pub fn synclan() -> Draft<Box<ISynclan>> {
        Self::global().synclan_config.clone()
    }
}
