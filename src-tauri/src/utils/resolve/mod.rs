use crate::{
    config::Config,
    core::logger::Logger,
    logging, logging_error,
    process::AsyncHandler,
    server,
    utils::{db, init, logging::Type, window_manager::WindowManager},
};
use anyhow::Result;

pub mod window;
pub mod window_script;

pub fn init_work_dir_and_logger() -> Result<()> {
    AsyncHandler::block_on(async {
        init_work_config().await;
        logging!(info, Type::Setup, "Initializing logger");
        Logger::global().init().await?;
        Ok(())
    })
}

pub fn resolve_server_setup_async() {
    AsyncHandler::spawn(|| async {
        logging_error!(Type::Server, db::DBManager::global().init().await);
        logging_error!(Type::Server, server::start_http_server().await);
    });
}

pub fn resolve_setup_async() {
    AsyncHandler::spawn(|| async {
        logging!(info, Type::Synclan, "Version: {}", env!("CARGO_PKG_VERSION"));

        #[cfg(target_os = "macos")]
        resolve_dock_show().await;
        init_window().await;
    });
}

pub async fn init_work_config() {
    logging_error!(Type::Setup, init::init_config().await);
}

pub(super) async fn init_window() {
    let is_silent_start = Config::synclan().await.data_arc().enable_silent_start.unwrap_or(false);
    WindowManager::create_window(!is_silent_start).await;
}

#[cfg(target_os = "macos")]
pub(super) async fn resolve_dock_show() {
    let is_silent_start = Config::synclan().await.data_arc().enable_silent_start.unwrap_or(false);
    if is_silent_start {
        use crate::core::handle::Handle;
        Handle::global().set_activation_policy_accessory();
    }
}
