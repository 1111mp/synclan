use crate::{
    config::{Config, ISynclan},
    logging,
    utils::{logging::Type, tls},
};
use anyhow::{anyhow, Result};
use chrono::{Local, NaiveDate, TimeZone};
use std::{
    fs::{self, DirEntry},
    net::IpAddr,
};
use tauri_plugin_dialog::{DialogExt, FilePath};

/// Automatically clear uploaded files
pub async fn uploaded_files_auto_cleanup() -> Result<()> {
    let synclan = Config::synclan().latest_ref().clone();
    let file_upload_dir = synclan
        .file_upload_dir
        .ok_or(anyhow!("File upload directory is not configured."))?;

    let auto_file_clean = { synclan.auto_file_clean.unwrap_or(0) };
    let day = match auto_file_clean {
        1 => 7,
        2 => 30,
        3 => 90,
        _ => return Ok(()),
    };

    logging!(
        debug,
        Type::Server,
        true,
        "try to delete uploaded files, day: {day}",
    );

    let today = Local::now();
    let process_file = |entry: DirEntry| -> Result<()> {
        if entry.file_type()?.is_dir() {
            let folder_name = entry.file_name();
            let folder_name = folder_name.to_str().unwrap_or_default();
            let created_time = NaiveDate::parse_from_str(folder_name, "%Y-%m-%d")?
                .and_hms_opt(0, 0, 0)
                .ok_or(anyhow::anyhow!("invalid time str"))?;
            let folder_time = Local
                .from_local_datetime(&created_time)
                .single()
                .ok_or(anyhow::anyhow!("invalid local datetime"))?;

            let duration = today.signed_duration_since(folder_time);
            if duration.num_days() > day {
                let folder_path = entry.path();
                let _ = fs::remove_dir_all(folder_path);
                logging!(
                    info,
                    Type::Server,
                    true,
                    "delete uploaded files: {folder_name}"
                );
            }
        }

        Ok(())
    };

    for entry in fs::read_dir(&file_upload_dir)?.flatten() {
        let _ = process_file(entry);
    }

    Ok(())
}

/// Exporting a Self-Signed Certificate
pub async fn export_server_cert(app_handle: &tauri::AppHandle) -> Result<()> {
    if let Some(FilePath::Path(folder_path)) = app_handle.dialog().file().blocking_pick_folder() {
        // certificate content
        let cert_pem = Config::synclan().latest_ref().cert_pem.clone();
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
                Config::synclan().draft_mut().patch_config(patch);
                Config::synclan().apply();
                Config::synclan().data_mut().save_config()?;

                cert_pem
            }
        };
        let cert_path = folder_path.join("synclan.crt");

        // writing to a file
        tokio::fs::write(&cert_path, cert_pem).await?;
    }

    Ok(())
}
