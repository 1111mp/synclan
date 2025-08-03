use super::Claims;
use crate::module::client::Client;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};

pub struct AuthGuard;

impl<S> FromRequestParts<S> for AuthGuard
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Unauthorized"))?;

        let client = Client::get_by_id(bearer.token())
            .await
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Unauthorized"))?
            .ok_or((StatusCode::UNAUTHORIZED, "Unauthorized"))?;
        parts.extensions.insert(Claims::new(client.id));

        Ok(Self)
    }
}
