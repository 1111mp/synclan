use super::{AppState, HttpResponse};
use crate::{
    config::Config,
    server::{
        api_doc::UPLOAD_TAG,
        dtos::upload_dto::{UploadCompleteDto, UploadInitDto},
        exception::HttpException,
        extractors::Body,
        routes::JsonResponse,
    },
};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_macros::debug_handler;
use axum_typed_multipart::{BaseMultipart, FieldData, TryFromMultipart, TypedMultipartError};
use serde::{Deserialize, Serialize};
use std::{path::Path, sync::Arc};
use tempfile::NamedTempFile;
use tokio::{fs, io::AsyncWriteExt as _};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

/// Default chunk size: 100MB
const DEFAULT_CHUNK_SIZE: u64 = 100 * 1024 * 1024;

/// Minimum chunk size: 50MB
const MIN_CHUNK_SIZE: u64 = 50 * 1024 * 1024;

/// Maximum chunk size: 200MB
const MAX_CHUNK_SIZE: u64 = 200 * 1024 * 1024;

pub fn protected_route() -> OpenApiRouter<Arc<AppState>> {
    let router = OpenApiRouter::new()
        .routes(routes!(upload_handler))
        .routes(routes!(init_upload))
        .routes(routes!(upload_chunk))
        .routes(routes!(complete_upload));
    OpenApiRouter::new().nest("/upload", router)
}

#[derive(TryFromMultipart, ToSchema)]
struct FileUpload {
    /// File's name
    #[schema(value_type = String)]
    pub name: String,

    /// Whether to store permanently (won't be automatically cleaned up)
    #[form_data(default = false)]
    #[schema(value_type = bool)]
    pub permanent: Option<bool>,

    /// Field size limits are disabled by default. The `limit` parameter can be used
    /// to set a specific size limit in bytes, like '5MiB' or '1GiB'. The value
    /// "unlimited" explicitly disables the limit (same as the default behavior).
    /// File or files to upload
    #[form_data(limit = "unlimited")]
    #[schema(value_type = String, format = Binary, content_media_type = "application/octet-stream")]
    pub file: FieldData<NamedTempFile>,
}

/// Upload files
///
/// If the file is uploaded successfully, the file URL will be returned.
#[utoipa::path(
    post,
    path = "",
    request_body(content_type = "multipart/form-data", content = FileUpload),
    responses(
        (status = OK, description = "the file URL", body = JsonResponse<String>)
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = UPLOAD_TAG
)]
#[debug_handler]
// Step 5: Define a handler that takes the custom multipart as argument.
// If the request is malformed, a `MultipartException` will be returned.
async fn upload_handler(input: SelfTypedMultipart<FileUpload>) -> Result<HttpResponse<String>, HttpException> {
    let synclan = Config::synclan().await.data_arc();
    let file_upload_dir = synclan.file_upload_dir.as_ref();
    let file_upload_dir = file_upload_dir.ok_or_else(|| {
        HttpException::ServiceUnavailableException(Some("File upload directory is not configured.".to_owned()))
    })?;

    let sub_path = if input.permanent.unwrap_or(false) {
        "assets".to_string()
    } else {
        chrono::Local::now().format("%Y-%m-%d").to_string()
    };

    let mut path = Path::new(&file_upload_dir).join(&sub_path);

    fs::create_dir_all(&path).await?;

    let file_name = &input.data.name;
    path.push(file_name);

    input
        .data
        .file
        .contents
        .persist(&path)
        .map_err(|err| HttpException::InternalServerErrorException(Some(err.to_string())))?;

    Ok(HttpResponse::Json {
        payload: format!("{}/{}", sub_path, file_name),
        message: None,
    })
}

/// Initialize a chunked file upload session.
///
/// Returns upload id and chunk information.
#[utoipa::path(
    post,
    path = "/chunk/init",
    request_body = UploadInitDto,
    responses(
        (status = OK, body = JsonResponse<UploadInitResponse>)
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = UPLOAD_TAG
)]
#[debug_handler]
async fn init_upload(Body(input): Body<UploadInitDto>) -> Result<HttpResponse<UploadInitResponse>, HttpException> {
    let upload_id = uuid::Uuid::new_v4().to_string();

    let synclan = Config::synclan().await.data_arc();
    let upload_dir = synclan.file_upload_dir.as_ref().ok_or_else(|| {
        HttpException::ServiceUnavailableException(Some("File upload directory is not configured".into()))
    })?;

    let chunk_size = if input.chunk_size == 0 {
        DEFAULT_CHUNK_SIZE
    } else {
        input.chunk_size.clamp(MIN_CHUNK_SIZE, MAX_CHUNK_SIZE)
    };
    //
    // ceil(size / chunk_size)
    //
    let total_chunks = input.size.div_ceil(chunk_size) as u32;

    let chunk_dir = Path::new(upload_dir).join("chunks").join(&upload_id);

    fs::create_dir_all(&chunk_dir).await?;

    //
    // Store upload metadata
    //
    let meta = serde_json::json!({
        "uploadId": upload_id,
        "name": input.name,
        "size": input.size,
        "chunkSize": chunk_size,
        "totalChunks": total_chunks,
    });

    fs::write(chunk_dir.join("meta.json"), meta.to_string()).await?;

    Ok(HttpResponse::Json {
        payload: UploadInitResponse {
            upload_id,
            chunk_size,
            total_chunks,
        },
        message: Some("Chunk upload initialized successfully".into()),
    })
}

#[derive(TryFromMultipart, ToSchema)]
#[try_from_multipart(rename_all = "camelCase")]
struct ChunkUpload {
    /// Upload id returned by /upload/chunk/init
    #[schema(value_type = String)]
    pub upload_id: String,

    /// Chunk index
    #[schema(value_type = u32)]
    pub index: u32,

    /// Chunk file
    #[form_data(limit = "unlimited")]
    #[schema(
        value_type = String,
        format = Binary,
        content_media_type = "application/octet-stream"
    )]
    pub file: FieldData<NamedTempFile>,
}

/// Upload a chunk of a file
///
/// The chunk will be stored in the upload directory under `chunks/{upload_id}/{index}.chunk`.
#[utoipa::path(
    post,
    path = "/chunk",
    request_body(content_type = "multipart/form-data", content = ChunkUpload),
    responses(
        (status = OK, description = "Chunk uploaded successfully")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = UPLOAD_TAG
)]
#[debug_handler]
async fn upload_chunk(input: SelfTypedMultipart<ChunkUpload>) -> Result<HttpResponse<()>, HttpException> {
    let synclan = Config::synclan().await.data_arc();
    let file_upload_dir = synclan.file_upload_dir.as_ref().ok_or_else(|| {
        HttpException::ServiceUnavailableException(Some("File upload directory is not configured.".to_owned()))
    })?;

    //
    // chunks/{upload_id}
    //
    let chunk_dir = Path::new(file_upload_dir).join("chunks").join(&input.data.upload_id);

    fs::create_dir_all(&chunk_dir).await?;

    //
    // {index}.chunk
    //
    let chunk_path = chunk_dir.join(format!("{}.chunk", input.data.index));

    if chunk_path.exists() {
        return Ok(HttpResponse::Json {
            payload: (),
            message: Some("Chunk already uploaded".into()),
        });
    }

    let tmp_path = chunk_dir.join(format!("{}.chunk.tmp", input.data.index));

    input
        .data
        .file
        .contents
        .persist(&tmp_path)
        .map_err(|err| HttpException::InternalServerErrorException(Some(err.to_string())))?;

    fs::rename(tmp_path, chunk_path).await?;

    Ok(HttpResponse::Json {
        payload: (),
        message: None,
    })
}

/// Complete chunked upload.
///
/// Merge all chunks into the final file.
#[utoipa::path(
    post,
    path = "/chunk/complete",
    request_body = UploadCompleteDto,
    responses(
        (
            status = OK,
            body = JsonResponse<UploadCompleteResponse>
        )
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = UPLOAD_TAG
)]
#[debug_handler]
async fn complete_upload(
    Body(input): Body<UploadCompleteDto>,
) -> Result<HttpResponse<UploadCompleteResponse>, HttpException> {
    let synclan = Config::synclan().await.data_arc();
    let upload_dir = synclan.file_upload_dir.as_ref().ok_or_else(|| {
        HttpException::ServiceUnavailableException(Some("File upload directory is not configured.".into()))
    })?;

    let chunk_dir = Path::new(upload_dir).join("chunks").join(&input.upload_id);
    if !chunk_dir.exists() {
        return Err(HttpException::BadRequestException(Some(
            "Upload session not found.".into(),
        )));
    }

    //
    // Read metadata
    //
    let meta_path = chunk_dir.join("meta.json");
    let meta_content = fs::read_to_string(&meta_path).await?;
    let meta: serde_json::Value = serde_json::from_str(&meta_content)
        .map_err(|err| HttpException::InternalServerErrorException(Some(err.to_string())))?;

    let filename = meta["name"]
        .as_str()
        .ok_or_else(|| HttpException::InternalServerErrorException(Some("Invalid upload metadata.".into())))?;
    let total_chunks = meta["totalChunks"]
        .as_u64()
        .ok_or_else(|| HttpException::InternalServerErrorException(Some("Invalid total chunks.".into())))?;

    //
    // Check all chunks exist
    //
    for index in 0..total_chunks {
        let chunk_path = chunk_dir.join(format!("{}.chunk", index));

        if !chunk_path.exists() {
            return Err(HttpException::BadRequestException(Some(format!(
                "Missing chunk {}.",
                index
            ))));
        }
    }

    let sub_path = chrono::Local::now().format("%Y-%m-%d").to_string();
    //
    // Create final directory
    //
    let final_dir = Path::new(upload_dir).join(&sub_path);

    fs::create_dir_all(&final_dir).await?;

    let final_path = final_dir.join(filename);

    //
    // Merge chunks
    //
    let mut output = fs::File::create(&final_path).await?;

    for index in 0..total_chunks {
        let chunk_path = chunk_dir.join(format!("{}.chunk", index));

        let mut chunk_file = fs::File::open(&chunk_path).await?;

        tokio::io::copy(&mut chunk_file, &mut output).await?;
    }

    output.flush().await?;

    //
    // Remove temporary chunks
    //
    fs::remove_dir_all(&chunk_dir).await?;

    let relative_path = format!("{}/{}", sub_path, filename);

    Ok(HttpResponse::Json {
        payload: UploadCompleteResponse { path: relative_path },
        message: Some("File uploaded successfully.".into()),
    })
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UploadCompleteResponse {
    /// Uploaded file path
    pub path: String,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UploadInitResponse {
    /// Upload session id
    pub upload_id: String,

    /// Actual chunk size used by server
    pub chunk_size: u64,

    /// Total chunks
    pub total_chunks: u32,
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
