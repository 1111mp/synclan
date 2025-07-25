use serde::Deserialize;
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub(crate) struct AccessCodeDto {
    #[validate(length(min = 8, message = "Invalid access code"))]
    pub code: String,
}
