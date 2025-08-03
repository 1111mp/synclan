use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use serde::{Deserialize, Serialize};

pub mod auth_guard;

pub use auth_guard::*;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub client_id: String,
}

impl Claims {
    pub fn new(client_id: String) -> Self {
        Self { client_id }
    }
}

impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let claims = parts
            .extensions
            .get::<Claims>()
            .ok_or((StatusCode::UNAUTHORIZED, "Unauthorized"))?;

        Ok(claims.clone())
    }
}
