use crate::{
    logging,
    utils::{logging::Type, resolve::window::build_new_window},
};
use std::pin::Pin;

pub struct WindowManager;

impl WindowManager {
    pub fn create_window(should_create: bool) -> Pin<Box<dyn Future<Output = bool> + Send>> {
        Box::pin(async move {
            logging!(
                info,
                Type::Window,
                "开始创建主窗口, should_create={}",
                should_create
            );

            if !should_create {
                return false;
            }

            match build_new_window().await {
                Ok(_) => {
                    logging!(info, Type::Window, "新窗口创建成功，等待前端渲染后显示");

                    #[cfg(target_os = "macos")]
                    {
                        use crate::core::handle;
                        handle::Handle::global().set_activation_policy_regular();
                    }

                    true
                }
                Err(e) => {
                    logging!(error, Type::Window, "新窗口创建失败: {}", e);
                    false
                }
            }
        })
    }
}
