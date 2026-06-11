use super::{
    AckResponse,
    store::{Client, Clients},
};
use crate::{
    module::{device, message::Message},
    server::AppState,
};
use anyhow::{Result, anyhow};
use apalis::prelude::TaskSink as _;
use axum::http::StatusCode;
use serde::Deserialize;
use socketioxide::extract::{AckSender, Data, Extension, SocketRef, State};
use std::sync::Arc;

async fn message_handler(app_state: &Arc<AppState>, payload: &Message) -> Result<()> {
    let message = payload.create().await?;
    let mut storage = app_state.message_storage.clone();
    storage.push(message).await?;

    Ok(())
}

pub async fn on_connection(socket: SocketRef) {
    socket.on(
        "synclan://message",
        async |Data(payload): Data<Message>, State::<Arc<AppState>>(app_state), ack: AckSender| {
            let resp = match message_handler(&app_state, &payload).await {
                Ok(_) => AckResponse {
                    status_code: StatusCode::OK,
                    message: None,
                },
                Err(err) => AckResponse {
                    status_code: StatusCode::INTERNAL_SERVER_ERROR,
                    message: Some(format!("Message processing failed: {}", err)),
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
    let client = device::Device::get_by_id(&fingerprint)
        .await?
        .ok_or_else(|| anyhow!("Unauthorized"))?;
    if !clients.contains(&client.id) {
        clients.add(Arc::new(Client::new(socket.id, client.id)));
    }

    Ok(())
}
