use crate::core::handle;

use anyhow::Result;
use std::path::PathBuf;
use tauri::Manager;

pub static APP_ID: &str = "io.github.1111mp.synclan";

pub static SYNCLAN_CONFIG: &str = "synclan.yaml";

/// get the syncio app home dir
pub fn app_home_dir() -> Result<PathBuf> {
    // 避免在Handle未初始化时崩溃
    let app_handle = match handle::Handle::global().app_handle() {
        Some(handle) => handle,
        None => {
            log::warn!(target: "app", "app_handle not initialized, using default path");
            // 使用可执行文件目录作为备用
            let exe_path = tauri::utils::platform::current_exe()?;
            let exe_dir = exe_path
                .parent()
                .ok_or(anyhow::anyhow!("failed to get executable directory"))?;

            // 使用系统临时目录 + 应用ID
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

            // 如果无法获取系统目录，则回退到可执行文件目录
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

/// sqlite db dir
pub fn app_db_dir() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("db"))
}

pub fn synclan_path() -> Result<PathBuf> {
    Ok(app_home_dir()?.join(SYNCLAN_CONFIG))
}
