use super::CmdResult;
use crate::{
    cmd::StringifyErr,
    feat,
    module::message::{CursorPaginatedMessages, Message, MessageAck, OfflineMessagesInfoMap},
};

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

#[tauri::command]
pub async fn get_offline_messages(receiver: String) -> CmdResult<Vec<Message>> {
    feat::get_offline_messages(&receiver).await.stringify_err()
}

#[tauri::command]
pub async fn get_offline_msgs_summary(receiver: String) -> CmdResult<Option<OfflineMessagesInfoMap>> {
    feat::get_offline_msgs_summary(&receiver).await.stringify_err()
}

#[tauri::command]
pub async fn update_ack(payload: MessageAck) -> CmdResult {
    payload.received().await.stringify_err()
}

#[tauri::command]
pub async fn delete_conversation_messages(self_id: String, target_id: String) -> CmdResult {
    feat::delete_conversation_messages(self_id, target_id)
        .await
        .stringify_err()
}

#[tauri::command]
pub async fn delete_message_by_uuid(device_id: String, uuid: String) -> CmdResult<bool> {
    feat::delete_message_by_uuid(&device_id, &uuid).await.stringify_err()
}
