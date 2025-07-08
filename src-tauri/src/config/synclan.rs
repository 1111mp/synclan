use crate::{
    config::{deserialize_encrypted, serialize_encrypted},
    utils::{dirs, help, i18n},
};
use anyhow::Result;
use log::LevelFilter;
use serde::{Deserialize, Serialize};

/// Synclan configuration
/// ### `synclan.yaml` schema
#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ISynclan {
    /// app log level
    /// silent | error | warn | info | debug| trace
    pub app_log_level: Option<String>,

    /// i18n
    pub locale: Option<String>,

    /// app theme
    /// `system` | `light` | `dark`
    pub theme: Option<String>,

    /// can the app auto startup
    pub enable_auto_launch: Option<bool>,

    /// not show the window on launch
    pub enable_silent_start: Option<bool>,

    /// Automatically check for updates
    pub auto_check_update: Option<bool>,

    /// 日志清理
    /// 0: 不清理; 1: 1天；2: 7天; 3: 30天; 4: 90天
    pub auto_log_clean: Option<i32>,

    /// Whether to enable random port
    pub enable_random_port: Option<bool>,

    /// Whether to enable encryption for local https server
    pub enable_encryption: Option<bool>,

    /// Self-signed certificates
    #[serde(
        serialize_with = "serialize_encrypted",
        deserialize_with = "deserialize_encrypted",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub cert_pem: Option<String>,

    /// Self-signed certificate signing key
    #[serde(
        serialize_with = "serialize_encrypted",
        deserialize_with = "deserialize_encrypted",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub signing_key_pem: Option<String>,
}

impl ISynclan {
    fn get_system_locale() -> String {
        let sys_lang = sys_locale::get_locale()
            .unwrap_or_else(|| String::from("en"))
            .to_lowercase();

        let lang_code = sys_lang.split(['_', '-']).next().unwrap_or("en");
        let supported_languages = i18n::get_supported_languages();

        if supported_languages.contains(&lang_code.to_string()) {
            lang_code.to_string()
        } else {
            String::from("en")
        }
    }

    pub fn new() -> Self {
        match dirs::synclan_path().and_then(|path| help::read_yaml(&path)) {
            Ok(config) => config,
            Err(err) => {
                log::error!(target: "app", "{err}");
                Self::template()
            }
        }
    }

    pub fn template() -> Self {
        Self {
            locale: Some(Self::get_system_locale()),
            theme: Some("system".to_string()),
            enable_auto_launch: Some(false),
            enable_silent_start: Some(false),
            auto_check_update: Some(true),
            enable_random_port: Some(false),
            auto_log_clean: Some(3), // default to 1 day
            enable_encryption: Some(true),
            ..Self::default()
        }
    }

    /// Save SyncLan App Config
    pub fn save_file(&self) -> Result<()> {
        help::save_yaml(&dirs::synclan_path()?, &self, Some("# SyncLan Config File"))
    }

    /// patch synclan config
    /// only save to file
    pub fn patch_config(&mut self, patch: ISynclan) {
        macro_rules! patch {
            ($key: tt) => {
                if patch.$key.is_some() {
                    self.$key = patch.$key;
                }
            };
        }

        patch!(app_log_level);
        patch!(locale);
        patch!(theme);
        patch!(enable_auto_launch);
        patch!(enable_silent_start);
        patch!(auto_check_update);
        patch!(auto_log_clean);
        patch!(enable_random_port);
        patch!(enable_encryption);
        patch!(cert_pem);
        patch!(signing_key_pem);
    }

    /// get app log level
    pub fn get_log_level(&self) -> LevelFilter {
        if let Some(level) = self.app_log_level.as_ref() {
            match level.to_lowercase().as_str() {
                "silent" => LevelFilter::Off,
                "error" => LevelFilter::Error,
                "warn" => LevelFilter::Warn,
                "info" => LevelFilter::Info,
                "debug" => LevelFilter::Debug,
                "trace" => LevelFilter::Trace,
                _ => LevelFilter::Info, // default to Info if not recognized
            }
        } else {
            LevelFilter::Info // default log level
        }
    }

    /// get cert pem
    pub fn get_cert_pem(&self) -> Option<String> {
        self.cert_pem.clone()
    }

    /// get signing key pem
    pub fn get_signing_key_pem(&self) -> Option<String> {
        self.signing_key_pem.clone()
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ISynclanResponse {
    pub app_log_level: Option<String>,
    pub locale: Option<String>,
    pub theme: Option<String>,
    pub enable_auto_launch: Option<bool>,
    pub enable_silent_start: Option<bool>,
    pub auto_check_update: Option<bool>,
    pub auto_log_clean: Option<i32>,
    pub enable_random_port: Option<bool>,
    pub enable_encryption: Option<bool>,
}

impl From<ISynclan> for ISynclanResponse {
    fn from(synclan: ISynclan) -> Self {
        Self {
            app_log_level: synclan.app_log_level,
            locale: synclan.locale,
            theme: synclan.theme,
            enable_auto_launch: synclan.enable_auto_launch,
            enable_silent_start: synclan.enable_silent_start,
            auto_check_update: synclan.auto_check_update,
            auto_log_clean: synclan.auto_log_clean,
            enable_random_port: synclan.enable_random_port,
            enable_encryption: synclan.enable_encryption,
        }
    }
}
