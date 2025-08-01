use anyhow::Result;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use crate::utils::db;

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: Option<i32>,
    pub uuid: String,
    pub sender: String,
    pub receiver: String,
    pub msg_type: MessageType,
    pub content: Option<String>,
    pub extra: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

impl Message {
    pub async fn create(&self) -> Result<Message> {
        let db_pool = db::get_db_pool()?;
        let message = sqlx::query_as::<_, Message>(
            r#"
            INSERT INTO messages (uuid, sender, receiver, msg_type, content, extra)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(&self.uuid)
        .bind(&self.sender)
        .bind(&self.receiver)
        .bind(&self.msg_type)
        .bind(&self.content)
        .bind(&self.extra)
        .fetch_one(&db_pool)
        .await?;

        Ok(message)
    }

    /// Get messages in pages
    pub async fn get_messages(
        receiver: &str,
        current: u32,
        page_size: u32,
    ) -> Result<PaginatedMessages> {
        let db_pool = db::get_db_pool()?;
        let offset = (current - 1) * page_size;

        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT id, uuid, sender, receiver, msg_type, content, extra, created_at, updated_at
            FROM messages
            WHERE receiver = $1
            ORDER BY id DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(receiver)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&db_pool)
        .await?;

        let total: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM messages
            WHERE receiver = $1
            "#,
        )
        .bind(receiver)
        .fetch_one(&db_pool)
        .await?;

        Ok(PaginatedMessages {
            messages,
            total,
            current,
            page_size,
        })
    }

    /// Get all offline messages
    /// TODO Paginated Query
    pub async fn get_offline_messages(receiver: &str) -> Result<Vec<Message>> {
        let db_pool = db::get_db_pool()?;
        let last_ack = MessageAck::get_last_ack(receiver)
            .await?
            .map_or(0, |a| a.last_ack.unwrap_or(0));
        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT id, uuid, sender, receiver, msg_type, content, extra, created_at, updated_at
            FROM messages
            WHERE receiver = $1 AND id > $2
            ORDER BY id DESC
            "#,
        )
        .bind(receiver)
        .bind(last_ack)
        .fetch_all(&db_pool)
        .await?;

        Ok(messages)
    }
}

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct MessageAck {
    pub receiver: String,
    pub last_ack: Option<i32>,
}

impl MessageAck {
    pub fn new(receiver: String, last_ack: Option<i32>) -> Self {
        Self { receiver, last_ack }
    }

    pub async fn received(&self) -> Result<()> {
        let db_pool = db::get_db_pool()?;
        sqlx::query(
            r#"
            INSERT INTO message_acks (receiver, last_ack)
            VALUES ($1, $2)
            ON CONFLICT(receiver) DO UPDATE SET last_ack = excluded.last_ack 
            "#,
        )
        .bind(&self.receiver)
        .bind(&self.last_ack)
        .execute(&db_pool)
        .await?;

        Ok(())
    }

    pub async fn get_last_ack(receiver: &str) -> Result<Option<MessageAck>> {
        let db_pool = db::get_db_pool()?;
        let message_ack = sqlx::query_as::<_, MessageAck>(
            r#"SELECT receiver, last_ack
            FROM message_acks 
            WHERE receiver = $1
            "#,
        )
        .bind(receiver)
        .fetch_optional(&db_pool)
        .await?;

        Ok(message_ack)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PaginatedMessages {
    pub messages: Vec<Message>,
    pub total: i64,
    pub current: u32,
    pub page_size: u32,
}

#[derive(Debug, Deserialize, Serialize, sqlx::Type)]
pub enum MessageStatus {
    Initial = 1,
    Received,
    Readed,
}

#[derive(Debug, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
pub enum MessageType {
    Text,
    Image,
    Video,
    File,
}

#[test]
fn test_serialize() {
    let msg = MessageType::Text;
    let json = serde_json::to_string(&msg).unwrap();
    assert_eq!(json, "\"text\"");
}

#[test]
fn test_deserialize() {
    let msg: MessageType = serde_json::from_str("\"video\"").unwrap();
    assert!(matches!(msg, MessageType::Video));
}
