use super::CmdResult;
use crate::{module::client::Client, wrap_err};

/// Get client info by id
#[tauri::command]
pub async fn get_client_by_id(id: String) -> CmdResult<Option<Client>> {
    wrap_err!(Client::get_by_id(&id).await)
}

/// Create client
#[tauri::command]
pub async fn create_client(payload: Client) -> CmdResult<Client> {
    let client = wrap_err!(payload.create().await)?;
    Ok(client)
}

/// Patch client
#[tauri::command]
pub async fn patch_client(payload: Client) -> CmdResult {
    wrap_err!(payload.patch().await)
}
