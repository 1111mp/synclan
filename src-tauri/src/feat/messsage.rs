use crate::module::message::{CursorPaginatedMessages, Message, OfflineMessagesInfoMap};
use anyhow::Result;

pub async fn get_messages(
    self_id: String,
    target_id: String,
    last_id: Option<i32>,
    page_size: u32,
) -> Result<CursorPaginatedMessages> {
    Message::get_messages(&self_id, &target_id, last_id, page_size).await
}

pub async fn get_offline_messages(receiver: &str) -> Result<Vec<Message>> {
    Message::get_offline_messages(receiver).await
}

pub async fn get_offline_msgs_summary(receiver: &str) -> Result<Option<OfflineMessagesInfoMap>> {
    Message::get_offline_msgs_summary(receiver).await
}

pub async fn delete_conversation_messages(self_id: String, target_id: String) -> Result<()> {
    Message::delete_conversation_messages(&self_id, &target_id).await
}

pub async fn delete_message_by_uuid(device_id: &str, uuid: &str) -> Result<bool> {
    Message::delete_by_uuid(device_id, uuid).await
}
