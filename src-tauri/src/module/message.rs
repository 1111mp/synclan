use crate::{
    server::events::{store::Clients, AckResponse},
    utils::db,
};
use anyhow::Result;
use axum::http::StatusCode;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use socketioxide::SocketIo;
use std::time::Duration;
use utoipa::ToSchema;

/// `MessageJob`
///
/// Represents the context for delivering a message to a client through Socket.IO.
///
/// Responsibilities:
/// - Holds a [`SocketIo`] instance for accessing sockets.
/// - Holds the active clients map for locating the target receiver.
/// - Provides [`MessageJob::job_fn`] to send a message with ACK support.
#[derive(Debug)]
pub struct MessageJob {
    /// Global Socket.IO instance used to look up sockets and emit events.
    io: SocketIo,

    /// Active client registry mapping user IDs to connected sockets.
    clients: Clients,
}

impl MessageJob {
    pub fn new(io: SocketIo, clients: Clients) -> Self {
        Self { io, clients }
    }

    /// Executes a single message delivery job.
    ///
    /// # Behavior
    /// - Checks whether the receiver is online.
    /// - If online, retrieves the corresponding socket.
    /// - Emits an `"on-message"` event with a 6-second timeout.
    /// - Waits for an ACK response from the client.
    /// - If the response status is `200 OK`, marks the message as received.
    ///
    /// # Arguments
    /// * `message` - The message to be delivered.
    ///
    /// # Returns
    /// * `Ok(())` if the job completed successfully.
    /// * `Err` if the message could not be delivered or ACK failed.
    pub async fn job_fn(&self, message: Message) -> Result<()> {
        if let Some(client) = self.clients.get(&message.receiver) {
            // online
            if let Some(socket) = self.io.get_socket(client.socket_id) {
                let response = socket
                    .timeout(Duration::from_secs(6))
                    .emit_with_ack::<_, AckResponse>("on-message", &message)?
                    .await?;
                if response.status_code == StatusCode::OK {
                    MessageAck::new(message.receiver, message.id)
                        .received()
                        .await?;
                }
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: Option<i32>,
    pub uuid: String,
    pub sender: String,
    pub receiver: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub r#type: MessageType,
    pub content: Option<String>,
    pub extra: Option<String>,
    #[schema(value_type = String, format = "date-time")]
    pub created_at: Option<NaiveDateTime>,
    #[schema(value_type = String, format = "date-time")]
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
        .bind(&self.r#type)
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

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct PaginatedMessages {
    pub messages: Vec<Message>,
    #[schema(default = 0)]
    pub total: i64,
    #[schema(default = 1)]
    pub current: u32,
    #[schema(default = 10)]
    pub page_size: u32,
}

#[derive(Debug, Deserialize, Serialize, sqlx::Type)]
pub enum MessageStatus {
    Initial = 1,
    Received,
    Readed,
}

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::Type, ToSchema)]
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
