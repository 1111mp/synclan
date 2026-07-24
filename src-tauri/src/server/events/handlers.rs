use super::{
    AckResponse,
    store::{Client, Clients},
};
use crate::{
    module::{
        device::{self, Device},
        message::Message,
    },
    server::AppState,
};
use anyhow::{Result, anyhow};
use apalis::prelude::TaskSink as _;
use axum::http::StatusCode;
use serde::Deserialize;
use socketioxide::extract::{AckSender, Data, Extension, SocketRef, State};
use std::sync::Arc;

async fn message_handler(app_state: &Arc<AppState>, payload: &Message) -> Result<Message> {
    let message = payload.create().await?;
    let mut storage = app_state.message_storage.clone();
    storage.push(message.clone()).await?;

    Ok(message)
}

pub async fn on_connection(socket: SocketRef) {
    socket.on(
        "synclan://message",
        async |Data(payload): Data<Message>, State::<Arc<AppState>>(app_state), ack: AckSender| {
            let resp = match message_handler(&app_state, &payload).await {
                Ok(saved_msg) => AckResponse {
                    status_code: StatusCode::OK,
                    message: None,
                    data: Some(saved_msg),
                },
                Err(err) => AckResponse {
                    status_code: StatusCode::INTERNAL_SERVER_ERROR,
                    message: Some(format!("Message processing failed: {}", err)),
                    data: None,
                },
            };

            ack.send(&resp).ok();
        },
    );

    socket.on_disconnect(
        async |_s: SocketRef, Extension::<Arc<Client>>(client), State::<Clients>(clients)| {
            // remove client from clients
            clients.remove(&client.client_id);
        },
    );
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Auth {
    pub device_id: Option<String>,
}

/// Handles the connection of a new user.
/// Be careful to not emit anything to the user before the authentication is done.
pub async fn authenticate_middleware(
    socket: SocketRef,
    Data(auth): Data<Auth>,
    State(clients): State<Clients>,
) -> Result<()> {
    let device_id = auth.device_id.ok_or_else(|| anyhow!("Unauthorized"))?;
    let device = device::Device::get_by_id(&device_id)
        .await?
        .ok_or_else(|| anyhow!("Unauthorized"))?;

    Device::touch(&device.id).await?;

    let client = Arc::new(Client::new(socket.id, device.id.clone()));
    if !clients.contains(&device.id) {
        clients.add(client.clone());
    }

    socket.extensions.insert(client);

    Ok(())
}
