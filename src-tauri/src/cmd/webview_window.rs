use super::CmdResult;
use crate::{
    cmd::StringifyErr,
    feat::{self, PreviewContext},
};
use tauri::utils::config::WindowConfig;

#[tauri::command]
pub async fn create_preview_window(
    app_handle: tauri::AppHandle,
    config: WindowConfig,
    context: PreviewContext,
) -> CmdResult {
    feat::create_preview_window(&app_handle, config, context).stringify_err()
}
