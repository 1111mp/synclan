use super::AppState;
use crate::{
    json_response,
    module::message::{Message, PaginatedMessages},
    server::{
        api_doc::MESSAGE_TAG,
        dtos::Pagination,
        exception::HttpException,
        extractors::Query,
        guards::Claims,
        routes::{HttpResponse, JsonResponse},
    },
};
use axum_macros::debug_handler;
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn protected_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new()
        .routes(routes!(get_messages))
        .routes(routes!(get_offline_messages));
    OpenApiRouter::new().nest("/messages", router)
}

/// Get message record list.
///
/// Get message list by paging.
#[utoipa::path(
  get,
  path = "",
  params(
    Pagination
  ),
  responses(
    (status = OK, body = JsonResponse<PaginatedMessages>)
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn get_messages(
    claims: Claims,
    Query(pagination): Query<Pagination>,
) -> Result<HttpResponse<PaginatedMessages>, HttpException> {
    let data =
        Message::get_messages(&claims.client_id, pagination.current, pagination.page_size).await?;

    json_response!(Some(data));
}

/// Get offline messages list.
///
/// Get offline messages list.
#[utoipa::path(
  get,
  path = "/offline",
  responses(
    (status = OK, body = JsonResponse<Vec<Message>>)
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn get_offline_messages(claims: Claims) -> Result<HttpResponse<Vec<Message>>, HttpException> {
    let messages = Message::get_offline_messages(&claims.client_id).await?;

    json_response!(Some(messages));
}
