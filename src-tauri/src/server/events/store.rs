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
        Self {
            socket_id,
            client_id,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Clients(Arc<DashMap<String, Arc<Client>>>);

impl Clients {
    pub fn get(&self, client_id: &str) -> Option<Arc<Client>> {
        self.0.get(client_id).map(|r| r.value().clone())
    }

    pub fn add(&self, client: Arc<Client>) {
        self.0.insert(client.client_id.clone(), client);
    }

    pub fn remove(&self, client_id: &str) -> Option<Arc<Client>> {
        self.0.remove(client_id).map(|(_, v)| v)
    }

    pub fn contains(&self, client_id: &str) -> bool {
        self.0.contains_key(client_id)
    }
}
