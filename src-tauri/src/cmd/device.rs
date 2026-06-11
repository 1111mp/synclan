use super::CmdResult;
use crate::{cmd::StringifyErr, feat, module::device::Device};

/// Get device info by id
#[tauri::command]
pub async fn get_device_by_id(id: String) -> CmdResult<Option<Device>> {
    feat::get_device_by_id(id).await.stringify_err()
}

/// Create device
#[tauri::command]
pub async fn register_device(payload: Device) -> CmdResult<Device> {
    payload.register().await.stringify_err()
}

/// Patch device
#[tauri::command]
pub async fn patch_device(payload: Device) -> CmdResult {
    payload.patch().await.stringify_err()
}
