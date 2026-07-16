use super::AppState;
use crate::{
    json_response,
    module::message::{CursorPaginatedMessages, Message, MessageAck, OfflineMessagesInfoMap, PaginatedMessages},
    server::{
        api_doc::MESSAGE_TAG,
        dtos::message_dto::{CursorPagination, DeleteMessagesDto, UpdateAckDto},
        exception::HttpException,
        extractors::{Body, Query},
        guards::Claims,
        routes::{HttpResponse, JsonResponse},
    },
};
use axum::extract::Path;
use axum_macros::debug_handler;
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn protected_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new()
        .routes(routes!(get_messages, update_ack, delete_conversation_messages))
        .routes(routes!(get_offline_messages))
        .routes(routes!(get_offline_messages_summary))
        .routes(routes!(delete_message));
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

/// Get offline messages summary.
///
/// Get offline messages summary.
#[utoipa::path(
  get,
  path = "/offline_summary",
  responses(
    (status = OK, body = JsonResponse<Option<OfflineMessagesInfoMap>>)
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn get_offline_messages_summary(
    claims: Claims,
) -> Result<HttpResponse<Option<OfflineMessagesInfoMap>>, HttpException> {
    let messages = Message::get_offline_msgs_summary(&claims.device_id).await?;
    json_response!(messages);
}

/// Update message ACK record.
///
/// Update the last acknowledged message ID for the current device.
#[utoipa::path(
  post,
  path = "/ack",
  request_body = UpdateAckDto,
  responses(
    (status = OK, description = "ACK updated successfully")
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn update_ack(Body(input): Body<UpdateAckDto>) -> Result<HttpResponse<()>, HttpException> {
    let ack_record = MessageAck::new(input.receiver, Some(input.last_ack));
    ack_record.received().await?;
    json_response!(());
}

/// Delete conversation messages.
///
/// Delete all messages between two devices.
#[utoipa::path(
  delete,
  path = "/conversation/{target_id}",
  params(
    ("target_id" = String, Path, description = "Target device ID"),
  ),
  responses(
    (status = OK, description = "Messages deleted successfully"),
    (status = 400, description = "Invalid query parameters"),
    (status = 401, description = "Unauthorized")
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn delete_conversation_messages(
    claims: Claims,
    Path(target_id): Path<String>,
) -> Result<HttpResponse<()>, HttpException> {
    Message::delete_conversation_messages(&claims.device_id, &target_id).await?;

    json_response!(());
}

/// Delete message by uuid.
///
/// Delete a single message by message uuid.
#[utoipa::path(
  delete,
  path = "/{uuid}",
  params(
    ("uuid" = String, Path, description = "Message UUID"),
  ),
  responses(
    (status = OK, description = "Message deleted successfully"),
    (status = 404, description = "Message not found"),
    (status = 401, description = "Unauthorized")
  ),
  security(
    ("bearer_auth" = [])
  ),
  tag = MESSAGE_TAG
)]
#[debug_handler]
async fn delete_message(claims: Claims, Path(uuid): Path<String>) -> Result<HttpResponse<bool>, HttpException> {
    let result = Message::delete_by_uuid(&claims.device_id, &uuid).await?;

    json_response!(result);
}
