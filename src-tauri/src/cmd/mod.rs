use anyhow::Result;

// Common result type used by command functions
pub type CmdResult<T = ()> = Result<T, String>;

pub mod app;
pub mod synclan;

pub use app::*;
pub use synclan::*;
