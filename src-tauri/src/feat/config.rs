use crate::{
    config::{Config, ISynclan},
    server,
};
use anyhow::Result;

#[derive(Clone, Copy)]
enum UpdateFlags {
    None = 0,
    RestartHttpServer = 1 << 0,
    SynclanConfig = 1 << 1,
}

/// Patch Synclan Configuration
pub async fn patch_config(patch: ISynclan, need_save_file: bool) -> Result<()> {
    Config::synclan().draft().patch_config(patch.clone());

    let enable_encryption = patch.enable_encryption;
    let result: Result<()> = {
        // Initialize with no flags set
        let mut update_flags = UpdateFlags::None as i32;

        if enable_encryption.is_some() {
            update_flags |= UpdateFlags::RestartHttpServer as i32;
        }

        // Process updates based on flags
        if (update_flags & (UpdateFlags::RestartHttpServer as i32)) != 0 {
            server::restart_http_server().await?;
        }

        <Result<()>>::Ok(())
    };

    match result {
        Ok(()) => {
            Config::synclan().apply();
            if need_save_file {
                Config::synclan().data().save_file()?;
            }

            Ok(())
        }
        Err(err) => {
            Config::synclan().discard();
            Err(err)
        }
    }
}
