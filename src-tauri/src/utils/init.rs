use crate::{
    config::ISynclan,
    logging,
    utils::{dirs, help, logging::Type},
};
use anyhow::Result;

async fn ensure_directories() -> Result<()> {
    let directories = [
        ("app_home", dirs::app_home_dir()?),
        ("file_upload", dirs::file_upload_dir()?),
        ("app_logs", dirs::app_logs_dir()?),
    ];

    for (name, dir) in directories {
        if !dir.exists() {
            tokio::fs::create_dir_all(&dir).await.map_err(|e| {
                anyhow::anyhow!("Failed to create {} directory {:?}: {}", name, dir, e)
            })?;
            logging!(info, Type::Setup, "Created {} directory: {:?}", name, dir);
        }
    }

    Ok(())
}

async fn initialize_config_files() -> Result<()> {
    if let Ok(path) = dirs::synclan_path()
        && !path.exists()
    {
        let template = ISynclan::template();
        help::save_yaml(&path, &template, Some("# SyncLan Config File"))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create synclan config: {}", e))?;
        logging!(info, Type::Setup, "Created synclan config at {:?}", path);
    }

    Ok(())
}

/// Initialize all the config files before tauri setup
pub async fn init_config() -> Result<()> {
    ensure_directories().await?;

    initialize_config_files().await?;

    Ok(())
}
