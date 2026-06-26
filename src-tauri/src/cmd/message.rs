use super::CmdResult;
use crate::{cmd::StringifyErr, feat, module::message::CursorPaginatedMessages};

/// Query messages
#[tauri::command]
pub async fn get_messages(
    self_id: String,
    target_id: String,
    last_id: Option<i32>,
    page_size: u32,
) -> CmdResult<CursorPaginatedMessages> {
    feat::get_messages(self_id, target_id, last_id, page_size)
        .await
        .stringify_err()
}
