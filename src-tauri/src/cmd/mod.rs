use anyhow::Result;

// Common result type used by command functions
pub type CmdResult<T = ()> = Result<T, String>;

pub mod app;
pub mod device;
pub mod server;
pub mod synclan;
pub mod system;
pub mod webview_window;

// pub use app::*;
pub use device::*;
pub use server::*;
pub use synclan::*;
pub use system::*;
pub use webview_window::*;

#[allow(unused)]
pub trait StringifyErr<T> {
    fn stringify_err(self) -> CmdResult<T>;
    fn stringify_err_log<F>(self, log_fn: F) -> CmdResult<T>
    where
        F: Fn(&str);
}

impl<T, E: std::fmt::Display> StringifyErr<T> for Result<T, E> {
    fn stringify_err(self) -> CmdResult<T> {
        self.map_err(|e| e.to_string())
    }

    fn stringify_err_log<F>(self, log_fn: F) -> CmdResult<T>
    where
        F: Fn(&str),
    {
        self.map_err(|e| {
            let msg = e.to_string();
            log_fn(&msg);
            msg
        })
    }
}
