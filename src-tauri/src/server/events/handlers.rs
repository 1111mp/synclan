use super::{
    store::{Client, Clients},
    AckResponse,
};
use crate::module::{
    client,
    message::{Message, MessageAck},
};
use anyhow::{anyhow, Result};
use axum::http::StatusCode;
use serde::Deserialize;
use socketioxide::{
    extract::{AckSender, Data, Extension, SocketRef, State},
    SocketIo,
};
use std::{sync::Arc, time::Duration};

async fn message_handler(io: &SocketIo, payload: &Message, clients: &Clients) -> Result<()> {
    let message = payload.create().await?;

    if let Some(client) = clients.get(&message.receiver) {
        // online
        if let Some(socket) = io.get_socket(client.socket_id) {
            // TODO Pushing messages through the task queue
            // Maybe we don't need it because the message concurrency is not high
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

pub async fn on_connection(socket: SocketRef, State(clients): State<Clients>) {
    eprintln!("clients: {:?}", clients);

    socket.on(
        "message",
        async |io: SocketIo,
               Data(payload): Data<Message>,
               State::<Clients>(clients),
               ack: AckSender| {
            if let Err(err) = message_handler(&io, &payload, &clients).await {
                ack.send(&AckResponse {
                    status_code: StatusCode::INTERNAL_SERVER_ERROR,
                    message: Some(format!("Failed to create message: {}", err)),
                })
                .ok();
            }
        },
    );

    socket.on_disconnect(
        |_s: SocketRef, Extension::<Arc<Client>>(client), State::<Clients>(clients)| {
            // remove client from clients
            clients.remove(&client.client_id);
        },
    );
}

#[derive(Debug, Deserialize)]
pub struct Auth {
    pub fingerprint: Option<String>,
}

/// Handles the connection of a new user.
/// Be careful to not emit anything to the user before the authentication is done.
pub async fn authenticate_middleware(
    socket: SocketRef,
    Data(auth): Data<Auth>,
    State(clients): State<Clients>,
) -> Result<()> {
    let fingerprint = auth.fingerprint.ok_or_else(|| anyhow!("Unauthorized"))?;
    let client = client::Client::get_by_id(fingerprint)
        .await?
        .ok_or_else(|| anyhow!("Unauthorized"))?;
    if !clients.contains(&client.id) {
        clients.add(Arc::new(Client::new(socket.id, client.id)));
    }

    Ok(())
}
