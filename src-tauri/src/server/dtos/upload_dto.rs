use serde::Deserialize;
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UploadInitDto {
    #[validate(length(min = 1, message = "Invalid name"))]
    #[schema(example = "video.mp4")]
    pub name: String,

    /// File size in bytes
    #[validate(range(min = 1, message = "Invalid size"))]
    #[schema(example = 104857600)]
    pub size: u64,

    /// Preferred chunk size in bytes
    #[validate(range(min = 1024, message = "Invalid chunk size"))]
    #[schema(example = 5242880)]
    pub chunk_size: u64,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UploadCompleteDto {
    /// Upload id returned by /upload/chunk/init
    pub upload_id: String,
}
