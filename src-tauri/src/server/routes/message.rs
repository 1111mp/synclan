use super::AppState;
use crate::{
    json_response,
    module::message::{CursorPaginatedMessages, Message, PaginatedMessages},
    server::{
        api_doc::MESSAGE_TAG,
        dtos::message_dto::CursorPagination,
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
    CursorPagination
  ),
  responses(
    (status = OK, body = JsonResponse<CursorPaginatedMessages>),
    (status = 400, description = "Invalid query parameters"),
    (status = 401, description = "Unauthorized")
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn get_messages(
    Query(pagination): Query<CursorPagination>,
) -> Result<HttpResponse<CursorPaginatedMessages>, HttpException> {
    let data = Message::get_messages(
        &pagination.self_id,
        &pagination.target_id,
        pagination.last_id,
        pagination.page_size,
    )
    .await?;
    json_response!(data);
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
    let messages = Message::get_offline_messages(&claims.device_id).await?;

    json_response!(messages);
}
