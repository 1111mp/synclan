mod cmd;
mod config;
mod core;
mod feat;
mod module;
mod process;
mod server;
mod utils;

use crate::{
    core::handle,
    process::AsyncHandler,
    utils::{resolve, window_manager::WindowManager},
};
use once_cell::sync::OnceCell;
use tauri::{AppHandle, Manager};
#[cfg(target_os = "macos")]
use tauri_plugin_autostart::MacosLauncher;
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
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        // Ensure single instance operation
        .plugin(
            tauri_plugin_single_instance::Builder::new()
                // Set a custom D-Bus ID, used on Linux
                // Defaults to the app's bundle identifier set in tauri.conf.json.
                .dbus_id("io.github.mp1111.synclan")
                .callback(|app_handle, _argc, _cwd| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                })
                .build(),
        )
        .setup(|app| {
            APP_HANDLE
                .set(app.app_handle().clone())
                .expect("failed to set global app handle");

            resolve::init_work_dir_and_logger()?;

            logging!(info, Type::Setup, "Starting application initialization...");

            if let Err(e) = setup_autostart(app) {
                logging!(error, Type::Setup, "Failed to setup autostart: {}", e);
            }

            resolve::resolve_setup_async();
            resolve::resolve_server_setup_async();

            logging!(info, Type::Setup, "初始化已启动");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // app
            cmd::restart_app,
            // synclan
            cmd::get_synclan_config,
            cmd::patch_synclan_config,
            // system
            cmd::get_system_theme,
            cmd::get_local_ip,
            cmd::is_admin,
            // server
            cmd::get_server_domain,
            cmd::clean_upload_files,
            cmd::export_server_cert,
            // device
            cmd::get_device_by_id,
            cmd::get_devices,
            cmd::devices_discover,
            cmd::register_device,
            cmd::patch_device,
            // message
            cmd::get_messages,
            cmd::get_offline_messages,
            cmd::get_offline_msgs_summary,
            cmd::update_ack,
            cmd::delete_conversation_messages,
            cmd::delete_message_by_uuid,
            // preview window
            cmd::create_preview_window
        ]);

    // Under memory pressure on macOS, the WKWebView rendering process may be
    // terminated by the system (resulting in a blank window).
    // Register a recovery hook: reload immediately if the window is visible;
    // otherwise, defer the reload until the next time the user opens the window.
    #[cfg(target_os = "macos")]
    let builder = builder.on_web_content_process_terminate(resolve::window::on_web_content_process_terminated);

    // Devtools plugin only in debug mode with feature tauri-dev
    // to avoid duplicated registering of logger since the devtools plugin also registers a logger
    #[cfg(all(debug_assertions, not(feature = "tokio-trace"), feature = "tauri-dev"))]
    {
        builder = builder.plugin(tauri_plugin_devtools::init());
    }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[allow(unused)]
    app.run(|app_handle, evt| match evt {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen {
            has_visible_windows, ..
        } => {
            if core::handle::Handle::global().is_exiting() {
                return;
            }
            AsyncHandler::spawn(move || async move {
                if !has_visible_windows {
                    handle::Handle::global().set_activation_policy_regular();
                    let _ = WindowManager::show_main_window().await;
                }
            });
        },
        tauri::RunEvent::Exit => AsyncHandler::block_on(async {
            // Windows session ending currently reaches Tao as WM_ENDSESSION and
            // destroys the loop without a preventable ExitRequested event.
            if !handle::Handle::global().is_exiting() {
                feat::quit().await;
            }
            logging!(info, Type::System, "Application exited");
        }),
        #[allow(unused_variables)]
        tauri::RunEvent::ExitRequested { api, code, .. } => {
            if code.is_none() {
                api.prevent_exit();
                if !handle::Handle::global().is_exiting() {
                    AsyncHandler::block_on(async {
                        feat::quit().await;
                    });
                }
            }
        },
        tauri::RunEvent::WindowEvent { label, event, .. } if label == "main" => match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                #[cfg(target_os = "macos")]
                handle::Handle::global().set_activation_policy_accessory();

                if core::handle::Handle::global().is_exiting() {
                    return;
                }

                api.prevent_close();
                if let Some(window) = WindowManager::get_main_window() {
                    let _ = window.hide();
                }
            },
            tauri::WindowEvent::Focused(focused) => {
                #[cfg(target_os = "macos")]
                if focused {
                    crate::utils::resolve::window::reload_main_window_if_needed();
                }
                //
            },
            #[cfg(target_os = "macos")]
            tauri::WindowEvent::Destroyed => {},
            _ => {},
        },
        _ => {},
    });
}

/// Setup autostart plugin
pub fn setup_autostart(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    let mut auto_start_plugin_builder = tauri_plugin_autostart::Builder::new();
    #[cfg(not(target_os = "macos"))]
    let auto_start_plugin_builder = tauri_plugin_autostart::Builder::new();

    #[cfg(target_os = "macos")]
    {
        auto_start_plugin_builder = auto_start_plugin_builder
            .macos_launcher(MacosLauncher::LaunchAgent)
            .app_name(&app.config().identifier);
    }
    app.handle().plugin(auto_start_plugin_builder.build())?;
    Ok(())
}
