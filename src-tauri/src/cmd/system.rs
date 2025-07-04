use super::CmdResult;
use crate::wrap_err;
use local_ip_address::local_ip;
use std::net::IpAddr;

#[tauri::command]
pub async fn get_local_ip() -> CmdResult<IpAddr> {
    wrap_err!(local_ip())
}
