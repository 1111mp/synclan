use serde::Deserialize;
use utoipa::{IntoParams, ToSchema};
use validator::{Validate, ValidationError};

pub mod synclan_dto;

#[derive(Debug, Deserialize, IntoParams, ToSchema, Validate)]
#[serde(rename_all = "camelCase")]
pub struct Pagination {
    #[serde(default = "default_current")]
    #[schema(default = 1)]
    #[validate(range(min = 1, message = "Invalid current"))]
    pub current: u32,

    #[serde(default = "default_page_size")]
    #[schema(default = 10)]
    #[validate(custom(function = "validate_page_size", message = "Invalid pageSize"))]
    pub page_size: u32,
}

fn default_current() -> u32 {
    1
}

fn default_page_size() -> u32 {
    10
}

fn validate_page_size(value: u32) -> Result<(), ValidationError> {
    match value {
        10 | 20 | 50 | 100 => Ok(()),
        _ => Err(ValidationError::new("invalid_page_size")),
    }
}
