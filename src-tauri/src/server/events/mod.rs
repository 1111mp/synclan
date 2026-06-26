use super::status_code_serde;
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};

pub mod handlers;
pub mod store;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AckResponse<T> {
    #[serde(with = "status_code_serde")]
    pub status_code: StatusCode,
    pub message: Option<String>,
    pub data: Option<T>,
}
