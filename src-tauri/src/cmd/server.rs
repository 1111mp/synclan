use super::CmdResult;
use crate::{config::Config, feat, wrap_err};
use std::fs;

/// Exporting a Self-Signed Certificate
#[tauri::command]
pub async fn export_server_cert(app_handle: tauri::AppHandle) -> CmdResult {
    wrap_err!(feat::export_server_cert(&app_handle).await)
}

/// Clean all uploaded files
#[tauri::command]
pub async fn clean_upload_files() -> CmdResult {
    if let Some(file_upload_dir) = Config::synclan().latest_ref().file_upload_dir.clone() {
        for entry in fs::read_dir(&file_upload_dir)
            .map_err(|err| err.to_string())?
            .flatten()
        {
            let path = entry.path();
            if path.is_dir() {
                let _ = fs::remove_dir_all(path);
            }
        }
    }

    Ok(())
}
