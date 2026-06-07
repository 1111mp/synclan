// https://github.com/Totodore/socketioxide/blob/main/examples/private-messaging/src/store.rs

use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};

use serde::Serialize;
use socketioxide::socket::Sid;

#[derive(Clone, Debug, Serialize)]
pub struct Client {
    pub socket_id: Sid,
    pub user_id: i32,
}

impl Client {
    pub fn new(socket_id: Sid, user_id: i32) -> Self {
        Self { socket_id, user_id }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Clients(Arc<RwLock<HashMap<i32, Arc<Client>>>>);

impl Clients {
    pub fn get(&self, user_id: i32) -> Option<Arc<Client>> {
        if let Ok(clients) = self.0.read() {
            clients.get(&user_id).cloned()
        } else {
            None
        }
    }

    pub fn add(&self, client: Arc<Client>) {
        if let Ok(mut clients) = self.0.write() {
            clients.insert(client.user_id, client);
        }
    }

    pub fn remove(&self, user_id: i32) {
        if let Ok(mut clients) = self.0.write() {
            clients.remove(&user_id);
        }
    }
}
