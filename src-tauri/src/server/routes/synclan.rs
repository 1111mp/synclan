use super::{AppState, EmptyPayload, HttpResponse};
use crate::{
    config::Config,
    http_exception, json_response,
    server::{
        api_doc::SYNCLAN_TAG, dtos::synclan_dto::AccessCodeDto, exception::HttpException,
        extractors::Body, routes::JsonResponse,
    },
};
use axum_macros::debug_handler;
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn public_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new().routes(routes!(verify_access_code));
    OpenApiRouter::new().nest("/synclan", router)
}

/// Verify the authorization code
///
/// If successful, identity credentials are returned
#[utoipa::path(
    post,
    path = "/access-code",
    request_body = AccessCodeDto,
    responses(
        (status = 200, description = "Authorization code verification passed.", body = JsonResponse<EmptyPayload>),
        (status = 401, description = "Authorization code verification failed.")
    ),
    tag = SYNCLAN_TAG
)]
#[debug_handler]
async fn verify_access_code(
    Body(input): Body<AccessCodeDto>,
) -> Result<HttpResponse<()>, HttpException> {
    let authorized_access_code = Config::synclan()
        .latest_ref()
        .authorized_access_code
        .clone()
        .ok_or(HttpException::UnauthorizedException(None))?;

    if authorized_access_code.ne(&input.code) {
        http_exception!(UnauthorizedException);
    }

    json_response!(None, "Authorization code verification passed.");
}
