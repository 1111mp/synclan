use super::CmdResult;
use crate::{cmd::StringifyErr, config::Config, feat};
use std::fs;

#[tauri::command]
pub async fn get_server_domain() -> CmdResult<String> {
    feat::get_server_domain().await.stringify_err()
}

/// Exporting a Self-Signed Certificate
#[tauri::command]
pub async fn export_server_cert(app_handle: tauri::AppHandle) -> CmdResult {
    feat::export_server_cert(&app_handle).await.stringify_err()
}

/// Clean all uploaded files immediately
#[tauri::command]
pub async fn clean_upload_files() -> CmdResult {
    if let Some(file_upload_dir) = Config::synclan().await.data_arc().file_upload_dir.as_deref() {
        for entry in fs::read_dir(file_upload_dir).map_err(|err| err.to_string())?.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let _ = fs::remove_dir_all(path);
            }
        }
    }

    Ok(())
}
