use crate::{
    config::{Config, ISynclan},
    logging,
    utils::{logging::Type, tls},
};
use anyhow::{Result, anyhow};
use chrono::{Local, NaiveDate};
use local_ip_address::local_ip;
use std::{net::IpAddr, path::Path};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tokio::fs;

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
pub async fn get_server_domain() -> Result<String> {
    let synclan = Config::synclan().await.latest_arc();
    let ip = local_ip()?;
    let port = synclan.http_server_port.unwrap_or(53317);
    let protocol = if synclan.enable_encryption.unwrap_or(false) {
        "https"
    } else {
        "http"
    };

    Ok(format!("{}://{}:{}", protocol, ip, port))
}

/// Exporting a Self-Signed Certificate
pub async fn export_server_cert(app_handle: &tauri::AppHandle) -> Result<()> {
    let Some(FilePath::Path(folder_path)) = app_handle.dialog().file().blocking_pick_folder() else {
        return Ok(());
    };
    // certificate content
    let cert_pem = Config::synclan().await.data_arc().cert_pem.clone();
    let cert_pem = match cert_pem {
        Some(cert) => cert,
        None => {
            let ip: IpAddr = "0.0.0.0".parse()?;
            let (cert_pem, signing_key_pem) = tls::generate_cert(&ip)?;

            // save to config
            let patch = ISynclan {
                cert_pem: Some(cert_pem.clone()),
                signing_key_pem: Some(signing_key_pem.clone()),
                ..ISynclan::default()
            };
            Config::synclan().await.edit_draft(|s| s.patch_config(&patch));
            Config::synclan().await.apply();
            Config::synclan().await.data_arc().save_config().await?;

            cert_pem
        },
    };
    let cert_path = folder_path.join("synclan.crt");
    // writing to a file
    tokio::fs::write(&cert_path, cert_pem).await?;

    Ok(())
}

/// Automatically clear uploaded files
pub async fn uploaded_files_auto_cleanup() -> Result<()> {
    let synclan = Config::synclan().await.data_arc();
    let file_upload_dir = synclan
        .file_upload_dir
        .as_ref()
        .ok_or(anyhow!("File upload directory is not configured."))?;

    // Remove the chunk directory if it exists
    let chunk_dir = Path::new(file_upload_dir).join("chunks");
    if fs::try_exists(&chunk_dir).await.unwrap_or(false)
        && let Err(e) = fs::remove_dir_all(&chunk_dir).await
    {
        logging!(warn, Type::Server, "Failed to remove chunk dir: {e}");
    }

    let auto_file_clean = { synclan.auto_file_clean.unwrap_or(0) };
    let day = match auto_file_clean {
        1 => 1,
        2 => 7,
        3 => 30,
        4 => 90,
        _ => return Ok(()),
    };

    logging!(info, Type::Server, "try to delete uploaded files, day: {day}",);

    let today = Local::now().date_naive();
    let mut dir = fs::read_dir(file_upload_dir).await?;
    while let Some(entry) = dir.next_entry().await? {
        let entry = match entry.file_type().await {
            Ok(t) if t.is_dir() => entry,
            _ => continue,
        };
        let folder_name = entry.file_name();
        let folder_name = match folder_name.to_str() {
            Some(s) => s,
            None => continue,
        };
        let folder_date = match NaiveDate::parse_from_str(folder_name, "%Y-%m-%d") {
            Ok(d) => d,
            Err(_) => continue,
        };
        let age = today.signed_duration_since(folder_date).num_days();
        if age > day {
            let folder_path = entry.path();
            let _ = fs::remove_dir_all(folder_path).await;
            logging!(info, Type::Server, "Delete uploaded files: {folder_name}");
        }
    }

    Ok(())
}
