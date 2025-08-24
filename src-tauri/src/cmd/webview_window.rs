use super::CmdResult;
use crate::{
    feat::{self, PreviewContext},
    wrap_err,
};
use tauri::utils::config::WindowConfig;

#[tauri::command]
pub async fn create_preview_window(
    app_handle: tauri::AppHandle,
    config: WindowConfig,
    context: PreviewContext,
) -> CmdResult {
    wrap_err!(feat::create_preview_window(&app_handle, config, context))
}
