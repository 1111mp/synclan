use serde::Deserialize;
use utoipa::{IntoParams, ToSchema};
use validator::{Validate, ValidationError};

#[derive(Debug, Deserialize, IntoParams, ToSchema, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CursorPagination {
    #[validate(length(min = 1, message = "Invalid device id"))]
    pub self_id: String,
    #[validate(length(min = 1, message = "Invalid device id"))]
    pub target_id: String,

    pub last_id: Option<i32>,

    #[serde(default = "super::default_page_size")]
    #[schema(default = 20)]
    #[validate(custom(function = "super::validate_page_size", message = "Invalid pageSize"))]
    pub page_size: u32,
}

#[derive(Debug, Deserialize, IntoParams, ToSchema, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAckDto {
    pub receiver: String,
    pub last_ack: i32,
}

#[derive(Debug, Deserialize, IntoParams, Validate)]
pub struct DeleteMessagesDto {
    #[validate(length(min = 1, message = "Invalid device id"))]
    pub self_id: String,
    #[validate(length(min = 1, message = "Invalid device id"))]
    pub target_id: String,
}
