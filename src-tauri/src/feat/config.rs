use crate::{
    config::{Config, ISynclan},
    logging,
    utils::logging::Type,
};
use anyhow::Result;

#[derive(Clone, Copy)]
enum UpdateFlags {
    None = 0,
    RestartHttpServer = 1 << 0,
    SynclanConfig = 1 << 1,
}

/// Patch Synclan Configuration
pub async fn patch_synclan(patch: &ISynclan, need_save_file: bool) -> Result<()> {
    Config::synclan()
        .await
        .edit_draft(|s| s.patch_config(patch));

    let enable_encryption = patch.enable_encryption;
    let result: Result<()> = {
        // Initialize with no flags set
        let mut update_flags = UpdateFlags::None as i32;

        if enable_encryption.is_some() {
            update_flags |= UpdateFlags::RestartHttpServer as i32;
        }

        // Process updates based on flags
        if (update_flags & (UpdateFlags::RestartHttpServer as i32)) != 0 {
            // server::restart_http_server().await?;
        }

        <Result<()>>::Ok(())
    };

    if let Err(err) = result {
        Config::synclan().await.discard();
        return Err(err);
    }
    Config::synclan().await.apply();
    if need_save_file {
        let synclan_data = Config::synclan().await.data_arc();
        logging!(
            debug,
            Type::Setup,
            "Saving Synclan configuration to file..."
        );
        synclan_data.save_config().await?;
    }
    Ok(())
}
