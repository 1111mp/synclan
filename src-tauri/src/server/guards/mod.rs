use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use serde::{Deserialize, Serialize};

pub mod auth_guard;

pub use auth_guard::*;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub device_id: String,
}

impl Claims {
    pub fn new(device_id: String) -> Self {
        Self { device_id }
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
