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

    /// Log CLeanup
    /// 0: No cleaning; 1: 1 day; 2: 7 days; 3: 30 days; 4: 90 days
    pub auto_log_clean: Option<i32>,

    /// Whether to enable authorized access
    pub enable_authorized_access: Option<bool>,

    /// Authorization access code
    #[serde(
        serialize_with = "serialize_encrypted",
        deserialize_with = "deserialize_encrypted",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub authorized_access_code: Option<String>,

    /// Whether to enable random port
    pub enable_random_port: Option<bool>,

    /// http server port
    pub http_server_port: Option<u16>,

    /// File Cleanup
    /// 0: No cleaning; 1: 1 day; 2: 7 days; 3: 30 days; 4: 90 days
    pub auto_file_clean: Option<i32>,

    /// File upload directory
    pub file_upload_dir: Option<String>,

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
        let file_upload_dir = dirs::file_upload_dir()
            .ok()
            .and_then(|path| path.to_str().map(|s| s.to_string()))
            .map(Some)
            .unwrap_or(None);

        Self {
            locale: Some(Self::get_system_locale()),
            theme: Some("system".to_string()),
            enable_auto_launch: Some(false),
            enable_silent_start: Some(false),
            auto_check_update: Some(true),
            enable_random_port: Some(false),
            auto_log_clean: Some(3), // default to 30 day
            enable_authorized_access: Some(false),
            http_server_port: Some(53317),
            file_upload_dir,
            auto_file_clean: Some(1), // default to 1 day
            #[cfg(target_os = "windows")]
            enable_encryption: Some(true),
            #[cfg(not(target_os = "windows"))]
            enable_encryption: Some(false),
            ..Self::default()
        }
    }

    /// Save SyncLan App Config
    pub fn save_config(&self) -> Result<()> {
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
        patch!(enable_authorized_access);
        patch!(authorized_access_code);
        patch!(enable_random_port);
        patch!(http_server_port);
        patch!(auto_file_clean);
        patch!(file_upload_dir);
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
    pub enable_authorized_access: Option<bool>,
    pub authorized_access_code: Option<String>,
    pub http_server_port: Option<u16>,
    pub auto_file_clean: Option<i32>,
    pub file_upload_dir: Option<String>,
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
            enable_authorized_access: synclan.enable_authorized_access,
            authorized_access_code: synclan.authorized_access_code,
            http_server_port: synclan.http_server_port,
            auto_file_clean: synclan.auto_file_clean,
            file_upload_dir: synclan.file_upload_dir,
            enable_random_port: synclan.enable_random_port,
            enable_encryption: synclan.enable_encryption,
        }
    }
}
