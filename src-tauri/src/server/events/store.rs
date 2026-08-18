// https://github.com/Totodore/socketioxide/blob/main/examples/private-messaging/src/store.rs

use dashmap::DashMap;
use serde::Serialize;
use socketioxide::socket::Sid;
use std::sync::Arc;

#[derive(Clone, Debug, Serialize)]
pub struct Client {
    pub socket_id: Sid,
    pub client_id: String,
}

impl Client {
    pub fn new(socket_id: Sid, client_id: String) -> Self {
        Self { socket_id, client_id }
    }
}

#[derive(Clone, Debug)]
pub struct Clients(Arc<DashMap<String, Arc<Client>>>);

impl Default for Clients {
    fn default() -> Self {
        Self::new()
    }
}

impl Clients {
    pub fn new() -> Self {
        Self(Arc::new(DashMap::new()))
    }

    pub fn get(&self, client_id: &str) -> Option<Arc<Client>> {
        self.0.get(client_id).map(|r| r.value().clone())
    }

    pub fn add(&self, client: Arc<Client>) {
        self.0.insert(client.client_id.clone(), client);
    }

    /// Removes a client only when the disconnected socket is still the
    /// socket currently registered for that device.
    ///
    /// A device can reconnect before the previous socket's disconnect event
    /// arrives. In that case, the old event must not remove the new socket.
    pub fn remove_if_socket_matches(&self, client_id: &str, socket_id: Sid) -> Option<Arc<Client>> {
        self.0
            .remove_if(client_id, |_, client| client.socket_id == socket_id)
            .map(|(_, client)| client)
    }
}
