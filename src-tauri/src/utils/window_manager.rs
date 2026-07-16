use crate::{
    logging,
    utils::{logging::Type, resolve::window::build_new_window},
};
use std::pin::Pin;

pub struct WindowManager;

impl WindowManager {
    #[cfg(target_os = "macos")]
    fn set_macos_activation_policy_regular() {
        use crate::core::handle;

        handle::Handle::global().set_activation_policy_regular();
    }

    pub fn create_window(should_create: bool) -> Pin<Box<dyn Future<Output = bool> + Send>> {
        Box::pin(async move {
            logging!(
                info,
                Type::Window,
                "Starting to create main window, should_create={}",
                should_create
            );

            if !should_create {
                return false;
            }

            #[cfg(target_os = "macos")]
            Self::set_macos_activation_policy_regular();

            match build_new_window().await {
                Ok(_) => {
                    logging!(
                        info,
                        Type::Window,
                        "New window created successfully, waiting for frontend rendering before showing"
                    );

                    true
                },
                Err(e) => {
                    logging!(error, Type::Window, "Failed to create new window: {}", e);
                    false
                },
            }
        })
    }
}
