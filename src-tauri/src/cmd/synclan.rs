use super::CmdResult;
use crate::{
    config::{Config, ISynclan, ISynclanResponse},
    feat, wrap_err,
};

/// get synclan configuration
#[tauri::command]
pub async fn get_synclan_config() -> CmdResult<ISynclanResponse> {
    let synclan = Config::synclan();
    let synclan_data = synclan.data().clone();
    Ok(ISynclanResponse::from(*synclan_data))
}

/// patch synclan configuration
#[tauri::command]
pub async fn patch_synclan_config(payload: ISynclan) -> CmdResult {
    wrap_err!(feat::patch_config(payload, true).await)
}
