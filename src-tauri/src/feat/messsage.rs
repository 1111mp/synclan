use crate::module::message::{CursorPaginatedMessages, Message};
use anyhow::Result;

pub async fn get_messages(
    self_id: String,
    target_id: String,
    last_id: Option<i32>,
    page_size: u32,
) -> Result<CursorPaginatedMessages> {
    Message::get_messages(&self_id, &target_id, last_id, page_size).await
}
