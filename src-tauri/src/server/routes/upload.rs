use super::{AppState, HttpResponse};
use crate::{
    config::Config,
    server::{api_doc::UPLOAD_TAG, exception::HttpException},
};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_macros::debug_handler;
use axum_typed_multipart::{BaseMultipart, FieldData, TryFromMultipart, TypedMultipartError};
use serde::Serialize;
use std::{path::Path, sync::Arc};
use tempfile::NamedTempFile;
use tokio::fs;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

pub fn public_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new().routes(routes!(upload_handler));
    OpenApiRouter::new().nest("/upload", router)
}

#[derive(TryFromMultipart, ToSchema)]
struct FileUpload {
    /// File's name
    #[schema(value_type = String)]
    pub name: String,

    /// Field size limits are disabled by default. The `limit` parameter can be used
    /// to set a specific size limit in bytes, like '5MiB' or '1GiB'. The value
    /// "unlimited" explicitly disables the limit (same as the default behavior).
    /// File or files to upload
    #[form_data(limit = "unlimited")]
    #[schema(value_type = String, format = Binary, content_media_type = "application/octet-stream")]
    pub file: FieldData<NamedTempFile>,
}

/// Step 5: Define a handler that takes the custom multipart as argument.
// If the request is malformed, a `MultipartException` will be returned.
#[utoipa::path(
    post,
    path = "",
    request_body(content_type = "multipart/form-data", content = FileUpload),
    tag = UPLOAD_TAG
)]
#[debug_handler]
async fn upload_handler(
    input: SelfTypedMultipart<FileUpload>,
) -> Result<HttpResponse<String>, HttpException> {
    let synclan = Config::synclan().data_ref().clone();
    let file_upload_dir = synclan.file_upload_dir.ok_or_else(|| {
        HttpException::ServiceUnavailableException(Some(
            "File upload directory is not configured.".to_owned(),
        ))
    })?;
    let date_str = chrono::Local::now().format("%Y-%m-%d").to_string();
    let mut path = Path::new(&file_upload_dir).join(&date_str);

    fs::create_dir_all(&path).await?;

    let file_name = &input.data.name;
    path.push(&file_name);

    input
        .data
        .file
        .contents
        .persist(&path)
        .map_err(|err| HttpException::InternalServerErrorException(Some(err.to_string())))?;

    Ok(HttpResponse::Json {
        payload: Some(format!("{}/{}", date_str, file_name)),
        message: None,
    })
}

/// Step 1: Define a custom error type.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MultipartException {
    message: String,
    status_code: u16,
}

/// Step 2: Implement `IntoResponse` for the custom error type.
impl IntoResponse for MultipartException {
    fn into_response(self) -> Response {
        (StatusCode::BAD_REQUEST, axum::Json(self)).into_response()
    }
}

/// Step 3: Implement `From<TypedMultipartError>` for the custom error type.
impl From<TypedMultipartError> for MultipartException {
    fn from(error: TypedMultipartError) -> Self {
        Self {
            message: error.to_string(),
            status_code: error.get_status().into(),
        }
    }
}

/// Step 4: Define a type alias for the multipart request (Optional).
type SelfTypedMultipart<T> = BaseMultipart<T, MultipartException>;
