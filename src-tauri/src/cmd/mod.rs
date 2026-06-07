use anyhow::Result;

// Common result type used by command functions
pub type CmdResult<T = ()> = Result<T, String>;

pub mod app;
pub mod server;
pub mod synclan;
pub mod system;

pub use app::*;
pub use server::*;
pub use synclan::*;
pub use system::*;
