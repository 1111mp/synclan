use super::AppState;
use crate::server::api_doc;
use axum_macros::debug_handler;
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn public_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new().routes(routes!(create_one));
    OpenApiRouter::new().nest("/user", router)
}

/// Create new User
///
/// Tries to create a new User or fails with 409 conflict if already exists.
#[utoipa::path(
  post,
  path = "",
  responses(
    (status = 200, description = "User created successfully"),
    (status = 409, description = "User already exists"),
  ),
  tag = api_doc::USER_TAG
)]
#[debug_handler]
pub(crate) async fn create_one() {}
