use crate::module::device::DeviceRole;
use serde::Deserialize;
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub(crate) struct RegistorDeviceDto {
    #[validate(length(min = 1, message = "Invalid id"))]
    pub id: String,

    #[validate(length(min = 1, message = "Invalid name"))]
    pub name: String,

    pub avatar: Option<String>,
    pub fingerprint_id: Option<String>,

    pub role: DeviceRole,

    pub platform: Option<String>,
    pub browser: Option<String>,
}
