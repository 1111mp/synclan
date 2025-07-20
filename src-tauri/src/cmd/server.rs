use super::CmdResult;
use crate::{config::Config, feat, wrap_err};
use local_ip_address::local_ip;
use std::fs;

/// Returns the full server domain (including protocol, IP address, and port).
///
/// This function determines whether to use `http` or `https` based on the
/// `enable_encryption` configuration flag. It also retrieves the configured
/// server port, defaulting to `53317` if none is specified.
///
/// # Example
/// - `http://192.168.1.10:53317`
/// - `https://192.168.1.10:53317`
///
/// # Returns
/// A `Result` containing the constructed domain string on success,
/// or an error message on failure.
///
/// # Errors
/// Returns an error if the local IP address cannot be determined.
#[tauri::command]
pub async fn get_server_domain() -> CmdResult<String> {
    let synclan = Config::synclan().latest_ref().clone();
    let ip = wrap_err!(local_ip())?;
    let port = synclan.http_server_port.unwrap_or(53317);
    let protocol = if synclan.enable_encryption.unwrap_or(false) {
        "https"
    } else {
        "http"
    };

    Ok(format!("{}://{}:{}", protocol, ip, port))
}

/// Exporting a Self-Signed Certificate
#[tauri::command]
pub async fn export_server_cert(app_handle: tauri::AppHandle) -> CmdResult {
    wrap_err!(feat::export_server_cert(&app_handle).await)
}

/// Clean all uploaded files immediately
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
