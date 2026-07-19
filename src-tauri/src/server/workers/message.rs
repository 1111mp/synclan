use crate::{
    module::message::{Message, MessageAck},
    server::events::{AckResponse, store::Clients},
};
use anyhow::Result;
use apalis::prelude::{Data, WorkerContext};
use axum::http::StatusCode;
use socketioxide::SocketIo;
use std::time::Duration;

pub struct MessageWorker;

impl MessageWorker {
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
    pub async fn send_message(
        message: Message,
        io: Data<SocketIo>,
        _worker: WorkerContext,
        clients: Data<Clients>,
    ) -> Result<()> {
        if let Some(client) = clients.get(&message.receiver)
            && let Some(ns) = io.of("/socket")
            && let Some(socket) = ns.get_socket(client.socket_id)
        {
            let response = socket
                .timeout(Duration::from_secs(6))
                .emit_with_ack::<_, AckResponse<()>>("synclan://message", &message)?
                .await?;
            if response.status_code == StatusCode::OK {
                MessageAck::new(message.receiver, message.id).received().await?;
            }
        }
        Ok(())
    }
}
