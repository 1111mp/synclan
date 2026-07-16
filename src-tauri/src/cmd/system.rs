use super::CmdResult;
use crate::{cmd::StringifyErr, core::autostart, feat};
use local_ip_address::local_ip;
use std::net::IpAddr;

#[tauri::command]
pub async fn get_local_ip() -> CmdResult<IpAddr> {
    local_ip().stringify_err()
}

#[tauri::command]
pub async fn get_system_theme() -> CmdResult<String> {
    feat::get_system_theme().map(|t| t.to_string()).stringify_err()
}

#[tauri::command]
#[cfg(target_os = "windows")]
pub fn is_admin() -> CmdResult<bool> {
    use deelevate::{PrivilegeLevel, Token};

    let result = Token::with_current_process()
        .and_then(|token| token.privilege_level())
        .map(|level| level != PrivilegeLevel::NotPrivileged)
        .unwrap_or(false);

    Ok(result)
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
pub async fn is_admin() -> CmdResult<bool> {
    let is_admin = autostart::is_binary_admin();
    Ok(is_admin)
}
