use super::CmdResult;
use crate::{cmd::StringifyErr, utils::dirs};

/// Open the application directory
#[allow(unused)]
#[tauri::command]
pub fn open_app_dir() -> CmdResult<()> {
    let app_dir = dirs::app_home_dir().stringify_err()?;
    open::that(app_dir).stringify_err()
}
