use super::{AppState, HttpResponse, JsonResponse};
use crate::{
    json_response,
    module::device::Device,
    server::{
        api_doc, dtos::device_dto::RegistorDeviceDto, exception::HttpException, extractors::Body, guards::Claims,
    },
};
use axum::extract::Path;
use axum_macros::debug_handler;
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn protected_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new().routes(routes!(get_by_id)).routes(routes!(get_all));
    OpenApiRouter::new().nest("/devices", router)
}

pub fn public_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new().routes(routes!(create_one));
    OpenApiRouter::new().nest("/devices", router)
}

/// Registor new Device
///
/// Tries to registor a new Device or fails with 409 conflict if already exists.
#[utoipa::path(
  post,
  path = "",
  request_body = RegistorDeviceDto,
  responses(
    (status = 200, description = "Device created successfully", body = JsonResponse<Device>),
    (status = 409, description = "Device already exists"),
  ),
  tag = api_doc::DEVICE_TAG
)]
#[debug_handler]
pub(crate) async fn create_one(Body(input): Body<RegistorDeviceDto>) -> Result<HttpResponse<Device>, HttpException> {
    let device = Device {
        id: input.id,
        name: input.name,
        avatar: input.avatar,
        fingerprint_id: input.fingerprint_id,
        role: input.role,
        platform: input.platform,
        browser: input.browser,
        ..Device::default()
    };
    let new_device = device.register().await?;
    json_response!(new_device);
}

/// Query Device by id
///
/// Query Device details from database storage.
#[utoipa::path(
  get,
  path = "/{id}",
  responses(
    (status = 200, description = "Query Device details successfully", body = JsonResponse<Option<Device>>),
		(status = 404, description = "Device not found")
  ),
  params(
    ("id" = i32, Path, description = "Post database id"),
  ),
  security(
    ("bearer_auth" = [])
  ),
	tag = api_doc::DEVICE_TAG
)]
#[debug_handler]
pub(crate) async fn get_by_id(Path(id): Path<String>) -> Result<HttpResponse<Option<Device>>, HttpException> {
    let device = Device::get_by_id(&id).await?;
    json_response!(device);
}

/// Query all Devices
///
/// Query all Device details from database storage.
#[utoipa::path(
  get,
  path = "",
  responses(
    (status = 200, description = "Query all Device details successfully", body = JsonResponse<Vec<Device>>),
  ),
  security(
    ("bearer_auth" = [])
  ),
	tag = api_doc::DEVICE_TAG
)]
#[debug_handler]
pub(crate) async fn get_all(claims: Claims) -> Result<HttpResponse<Vec<Device>>, HttpException> {
    let devices = Device::get_all(Some(&claims.device_id)).await?;
    json_response!(devices);
}
