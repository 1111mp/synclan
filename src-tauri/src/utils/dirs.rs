use crate::core::handle;

use anyhow::Result;
use std::{fs, path::PathBuf};
use tauri::Manager;

pub static APP_ID: &str = "io.github.1111mp.synclan";

pub static SYNCLAN_CONFIG: &str = "synclan.yaml";

/// get the syncio app home dir
pub fn app_home_dir() -> Result<PathBuf> {
    // Avoid crashing when Handle is not initialized
    let app_handle = match handle::Handle::global().app_handle() {
        Some(handle) => handle,
        None => {
            log::warn!(target: "app", "app_handle not initialized, using default path");
            // Use the executable directory as a fallback
            let exe_path = tauri::utils::platform::current_exe()?;
            let exe_dir = exe_path
                .parent()
                .ok_or(anyhow::anyhow!("failed to get executable directory"))?;

            // Use the system temporary directory + application ID
            #[cfg(target_os = "windows")]
            {
                if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
                    let path = PathBuf::from(local_app_data).join(APP_ID);
                    return Ok(path);
                }
            }

            #[cfg(target_os = "macos")]
            {
                if let Some(home) = std::env::var_os("HOME") {
                    let path = PathBuf::from(home)
                        .join("Library")
                        .join("Application Support")
                        .join(APP_ID);
                    return Ok(path);
                }
            }

            #[cfg(target_os = "linux")]
            {
                if let Some(home) = std::env::var_os("HOME") {
                    let path = PathBuf::from(home)
                        .join(".local")
                        .join("share")
                        .join(APP_ID);
                    return Ok(path);
                }
            }

            // If the system directory cannot be obtained, fall back to the executable directory
            let fallback_dir = PathBuf::from(exe_dir).join(".config").join(APP_ID);
            log::warn!(target: "app", "Using fallback data directory: {:?}", fallback_dir);
            return Ok(fallback_dir);
        }
    };

    match app_handle.path().data_dir() {
        Ok(dir) => Ok(dir.join(APP_ID)),
        Err(e) => {
            log::error!(target: "app", "Failed to get the app home directory: {}", e);
            Err(anyhow::anyhow!("Failed to get the app homedirectory"))
        }
    }
}

/// get the resources dir
pub fn app_resources_dir() -> Result<PathBuf> {
    // Avoid crashes when Handle is not initialized
    let app_handle = match handle::Handle::global().app_handle() {
        Some(app_handle) => app_handle,
        None => {
            log::warn!(target: "app", "app_handle not initialized in app_resources_dir, using fallback");
            // Using the executable directory as a fallback
            let exe_dir = tauri::utils::platform::current_exe()?
                .parent()
                .ok_or(anyhow::anyhow!("failed to get executable directory"))?
                .to_path_buf();
            return Ok(exe_dir.join("resources"));
        }
    };

    match app_handle.path().resource_dir() {
        Ok(dir) => Ok(dir.join("resources")),
        Err(err) => {
            log::error!(target: "app", "Failed to get the resource directory: {}", err);
            Err(anyhow::anyhow!("Failed to get the resource directory"))
        }
    }
}

/// logs dir
pub fn app_logs_dir() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("logs"))
}

/// file upload dir
pub fn file_upload_dir() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("uploads"))
}

/// sqlite db dir
pub fn app_db_dir() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("db"))
}

/// `synclan.yaml` file path
pub fn synclan_path() -> Result<PathBuf> {
    Ok(app_home_dir()?.join(SYNCLAN_CONFIG))
}

pub fn get_encryption_key() -> Result<Vec<u8>> {
    let app_dir = app_home_dir()?;
    let key_path = app_dir.join(".encryption_key");

    if key_path.exists() {
        // Read existing key
        fs::read(&key_path).map_err(|e| anyhow::anyhow!("Failed to read encryption key: {}", e))
    } else {
        // Generate and save new key
        let mut key = vec![0u8; 32];
        getrandom::fill(&mut key)?;

        // Ensure directory exists
        if let Some(parent) = key_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| anyhow::anyhow!("Failed to create key directory: {}", e))?;
        }
        // Save key
        fs::write(&key_path, &key)
            .map_err(|e| anyhow::anyhow!("Failed to save encryption key: {}", e))?;
        Ok(key)
    }
}
