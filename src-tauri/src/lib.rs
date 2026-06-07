mod cmd;
mod config;
mod core;
mod feat;
mod process;
mod server;
mod utils;

use core::handle;
use process::AsyncHandler;
use tokio::time::{timeout, Duration};
use utils::{logging::Type, resolve};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    #[cfg(debug_assertions)]
    let devtools = tauri_plugin_devtools::init();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            logging!(info, Type::Setup, true, "开始应用初始化...");

            let app_handle = app.handle().clone();
            AsyncHandler::spawn(move || async move {
                logging!(info, Type::Setup, true, "异步执行应用设置...");
                match timeout(
                    Duration::from_secs(30),
                    resolve::resolve_setup_async(&app_handle),
                )
                .await
                {
                    Ok(_) => {
                        logging!(info, Type::Setup, true, "应用设置成功完成");
                    }
                    Err(_) => {
                        logging!(
                            error,
                            Type::Setup,
                            true,
                            "应用设置超时(30秒)，继续执行后续流程"
                        );
                    }
                }
            });

            logging!(info, Type::Setup, true, "初始化核心句柄...");
            handle::Handle::global().init(app.handle());

            logging!(info, Type::Setup, true, "初始化配置...");
            if let Err(e) = utils::init::init_config() {
                logging!(error, Type::Setup, true, "初始化配置失败: {}", e);
            }

            logging!(info, Type::Setup, true, "初始化完成，继续执行");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // synclan
            cmd::get_synclan_config,
            cmd::patch_synclan_config,
            // system
            cmd::get_local_ip,
            // server
            cmd::clean_upload_files,
            cmd::export_server_cert
        ]);

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, err| match err {
        _ => {}
    });
}
