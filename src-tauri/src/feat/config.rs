use crate::{
    config::{Config, ISynclan},
    core::{autostart, logger::Logger},
    logging, server,
    utils::logging::Type,
};
use anyhow::Result;
use bitflags::bitflags;

// Define update flags as bitflags for better performance
bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
    struct UpdateFlags: u16 {
        const RESTART_HTTP_SERVER = 1 << 0;
        const LAUNCH = 1 << 1;
        const LANGUAGE = 1 << 2;
        const LOG_LEVEL = 1 << 3;
        const LOG_FILE = 1 << 4;
    }
}

/// Patch Synclan Configuration
pub async fn patch_synclan(patch: &ISynclan, need_save_file: bool) -> Result<()> {
    Config::synclan().await.edit_draft(|s| s.patch_config(patch));

    let update_flags = determine_update_flags(patch);
    logging!(debug, Type::Setup, "Determined update flags: {:?}", update_flags);
    let process_flag_result: std::result::Result<(), anyhow::Error> = {
        process_terminated_flags(update_flags, patch).await?;
        Ok(())
    };

    if let Err(err) = process_flag_result {
        Config::synclan().await.discard();
        return Err(err);
    }
    Config::synclan().await.apply();
    if need_save_file {
        let synclan_data = Config::synclan().await.data_arc();
        logging!(debug, Type::Setup, "Saving Synclan configuration to file...");
        synclan_data.save_config().await?;
    }
    Ok(())
}

fn determine_update_flags(patch: &ISynclan) -> UpdateFlags {
    let auto_launch = patch.enable_auto_launch;
    let http_server_port = &patch.http_server_port;
    let enable_encryption = &patch.enable_encryption;
    let file_upload_dir = &patch.file_upload_dir;
    let log_level = &patch.app_log_level;
    let log_max_size = patch.app_log_max_size;
    let log_max_count = patch.app_log_max_count;

    let restart_http_server = http_server_port.is_some() || enable_encryption.is_some() || file_upload_dir.is_some();

    let mut update_flags = UpdateFlags::empty();

    if auto_launch.is_some() {
        update_flags.insert(UpdateFlags::LAUNCH);
    }
    if restart_http_server {
        update_flags.insert(UpdateFlags::RESTART_HTTP_SERVER);
    }
    if log_level.is_some() {
        update_flags.insert(UpdateFlags::LOG_LEVEL);
    }
    if log_max_size.is_some() || log_max_count.is_some() {
        update_flags.insert(UpdateFlags::LOG_FILE);
    }

    update_flags
}

async fn process_terminated_flags(update_flags: UpdateFlags, patch: &ISynclan) -> Result<()> {
    if update_flags.contains(UpdateFlags::LAUNCH) {
        autostart::update_launch().await?;
    }
    if update_flags.contains(UpdateFlags::RESTART_HTTP_SERVER) {
        server::restart_http_server().await?;
    }
    if update_flags.contains(UpdateFlags::LOG_LEVEL) {
        Logger::global().update_log_level(patch.get_log_level())?;
    }
    if update_flags.contains(UpdateFlags::LOG_FILE) {
        let log_max_size = patch.app_log_max_size.unwrap_or(128);
        let log_max_count = patch.app_log_max_count.unwrap_or(8);
        Logger::global().update_log_config(log_max_size, log_max_count).await?;
    }

    Ok(())
}
