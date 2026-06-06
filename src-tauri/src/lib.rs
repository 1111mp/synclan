mod cmd;
mod config;
mod core;
mod feat;
mod module;
mod process;
mod server;
mod utils;

use crate::utils::resolve;
use once_cell::sync::OnceCell;
use tauri::{AppHandle, Manager};
use utils::logging::Type;

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    utils::linux::workarounds::apply_nvidia_dmabuf_renderer_workaround();
    #[cfg(target_os = "linux")]
    utils::linux::workarounds::apply_wayland_webkit_fix();

    let _ = utils::dirs::init_portable_flag();

    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            APP_HANDLE
                .set(app.app_handle().clone())
                .expect("failed to set global app handle");

            resolve::init_work_dir_and_logger()?;

            logging!(info, Type::Setup, "Starting application initialization...");

            resolve::resolve_setup_async();
            resolve::resolve_server_setup_async();

            logging!(info, Type::Setup, "初始化已启动");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // synclan
            cmd::get_synclan_config,
            cmd::patch_synclan_config,
            // system
            cmd::get_local_ip,
            cmd::is_admin,
            // server
            cmd::clean_upload_files,
            cmd::export_server_cert,
            // client
            cmd::get_client_by_id,
            cmd::create_client,
            cmd::patch_client,
            // preview window
            cmd::create_preview_window
        ]);

    // Devtools plugin only in debug mode with feature tauri-dev
    // to avoid duplicated registering of logger since the devtools plugin also registers a logger
    #[cfg(all(debug_assertions, not(feature = "tokio-trace"), feature = "tauri-dev"))]
    {
        builder = builder.plugin(tauri_plugin_devtools::init());
    }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, err| match err {
        _ => {}
    });
}
