use super::CmdResult;
use crate::{cmd::StringifyErr, module::client::Client};

/// Get client info by id
#[tauri::command]
pub async fn get_client_by_id(id: String) -> CmdResult<Option<Client>> {
    Client::get_by_id(&id).await.stringify_err()
}

/// Create client
#[tauri::command]
pub async fn create_client(payload: Client) -> CmdResult<Client> {
    payload.create().await.stringify_err()
}

/// Patch client
#[tauri::command]
pub async fn patch_client(payload: Client) -> CmdResult {
    payload.patch().await.stringify_err()
}
