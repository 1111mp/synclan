use super::CmdResult;
use crate::{utils::dirs, wrap_err};

/// Open the application directory
#[tauri::command]
pub fn open_app_dir() -> CmdResult<()> {
    let app_dir = wrap_err!(dirs::app_home_dir())?;
    wrap_err!(open::that(app_dir))
}
