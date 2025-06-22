use anyhow::Result;
use tauri::{AppHandle, Manager};

use crate::{
    core::handle,
    logging, logging_error, server,
    utils::{db, help, logging::Type},
};

pub async fn resolve_setup_async(app_handle: &AppHandle) {
    logging!(info, Type::Setup, true, "执行异步设置任务...");

    #[cfg(target_os = "macos")]
    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Regular);

    // Database initialization
    logging_error!(Type::Setup, true, db::DBManager::global().init());

    // Start the web http server
    server::start_http_server();

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
    let background_color = help::get_app_background_color();
    let mut builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("SyncLan")
    .decorations(true)
    .inner_size(1080.0, 800.0)
    .min_inner_size(750.0, 500.0)
    .background_color(background_color)
    .visible(true)
    .center();

    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay);
    }

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
