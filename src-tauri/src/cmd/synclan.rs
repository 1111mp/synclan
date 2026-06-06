use super::CmdResult;
use crate::{
    cmd::StringifyErr as _,
    config::{Config, ISynclan, SharedDraft},
    feat,
};

/// get synclan configuration
#[tauri::command]
pub async fn get_synclan_config() -> CmdResult<SharedDraft<ISynclan>> {
    let draft = Config::synclan().await;
    let data = draft.data_arc();
    Ok(data)
}

/// patch synclan configuration
#[tauri::command]
pub async fn patch_synclan_config(payload: ISynclan) -> CmdResult {
    feat::patch_synclan(&payload, true).await.stringify_err()
}
