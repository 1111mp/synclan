use std::sync::Arc;

use anyhow::{anyhow, Result};
use axum::http::header;
use socketioxide::extract::{Extension, SocketRef, State};

use super::store::{Client, Clients};

pub async fn on_connection(
    socket: SocketRef,
    State(clients): State<Clients>,
    Extension::<Arc<Client>>(client): Extension<Arc<Client>>,
) {
    eprintln!("socket_id: {}", socket.id);
    eprintln!("client: {}", client.socket_id);
    eprintln!("client: {}", client.user_id);
    eprintln!("clients: {:?}", clients);

    socket.on_disconnect(
        |_s: SocketRef, Extension::<Arc<Client>>(client), State::<Clients>(clients)| {
            // remove client from clients
            clients.remove(client.user_id);
        },
    );
}

/// Handles the connection of a new user.
/// Be careful to not emit anything to the user before the authentication is done.
pub async fn authenticate_middleware(
    socket: SocketRef,
    State(clients): State<Clients>,
) -> Result<()> {
    // let cookies = socket
    //     .req_parts()
    //     .headers
    //     .get(header::COOKIE)
    //     .and_then(|c| c.to_str().ok())
    //     .ok_or(anyhow!("Unauthorized"))?;
    // let cookie = get_cookie_value(cookies, APP_AUTH_KEY.as_str()).ok_or(anyhow!("Unauthorized"))?;
    // let claims = jwt_decode(&cookie).expect("Unauthorized");

    // let client = Arc::new(Client::new(socket.id, claims.user_id));
    // socket.extensions.insert(client.clone());
    // clients.add(client);
    Ok(())
}
