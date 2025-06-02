use anyhow::Result;
use tauri::{AppHandle, Manager};

use crate::{core::handle, logging, utils::logging::Type};

pub async fn resolve_setup_async(app_handle: &AppHandle) {
    logging!(info, Type::Setup, true, "执行异步设置任务...");

    #[cfg(target_os = "macos")]
    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Regular);

    let _ = create_window();
}

pub fn create_window() -> Result<()> {
    if let Some(app_handle) = handle::Handle::global().app_handle() {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
            return Ok(());
        }
    }

    let app_handle = handle::Handle::global().app_handle().unwrap();
    let builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("SyncLan")
    .inner_size(1024.0, 728.0)
    .min_inner_size(1024.0, 728.0)
    .visible(false)
    .center();

    #[cfg(target_os = "windows")]
    let builder = builder.transparent(true);

    match builder.build() {
        Ok(window) => {
            tauri::async_runtime::spawn(async move {
                // Attempt to show and focus the window first.
                let _ = window.show();
                let _ = window.set_focus();

                #[cfg(debug_assertions)]
                window.open_devtools();
            });
        }
        Err(err) => {
            logging!(error, Type::Window, true, "主窗口构建失败: {}", err);
        }
    };

    Ok(())
}
