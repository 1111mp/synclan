use super::status_code_serde;
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};

pub mod handlers;
pub mod store;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AckResponse {
    #[serde(with = "status_code_serde")]
    status_code: StatusCode,
    message: Option<String>,
}
