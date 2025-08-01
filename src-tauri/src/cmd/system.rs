use super::CmdResult;
use crate::wrap_err;
use local_ip_address::local_ip;
use std::net::IpAddr;

#[tauri::command]
pub async fn get_local_ip() -> CmdResult<IpAddr> {
    wrap_err!(local_ip())
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
    #[cfg(target_os = "macos")]
    {
        Ok(unsafe { libc::geteuid() } == 0)
    }

    #[cfg(target_os = "linux")]
    {
        Ok(unsafe { libc::geteuid() } == 0)
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        Ok(false)
    }
}
