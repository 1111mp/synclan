mod body_extractor;
mod param_extractor;
mod query_extractor;

pub use body_extractor::*;
pub use param_extractor::*;
pub use query_extractor::*;

use axum::{
    extract::{
        path::ErrorKind,
        rejection::{JsonRejection, PathRejection, QueryRejection},
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;
use validator::ValidationErrors;

#[derive(Debug, Error)]
pub enum ParserRejection {
    #[error(transparent)]
    ValidationErrors(#[from] ValidationErrors),

    #[error(transparent)]
    JsonRejection(#[from] JsonRejection),

    #[error(transparent)]
    PathRejection(#[from] PathRejection),

    #[error(transparent)]
    QueryRejection(#[from] QueryRejection),
}

impl ParserRejection {
    fn into_json_response(
        status_code: StatusCode,
        message: String,
        location: Option<String>,
    ) -> Response {
        (
            status_code,
            Json(ParserRejectionResponse {
                status_code: status_code.as_u16(),
                message,
                location,
            }),
        )
            .into_response()
    }
}

impl IntoResponse for ParserRejection {
    fn into_response(self) -> Response {
        match self {
            ParserRejection::ValidationErrors(_) => {
                let message = format!("Input validation error: [{self}]").replace('\n', ", ");
                Self::into_json_response(StatusCode::BAD_REQUEST, message, None)
            }
            ParserRejection::JsonRejection(rejection) => {
                Self::into_json_response(StatusCode::BAD_REQUEST, rejection.body_text(), None)
            }
            ParserRejection::PathRejection(rejection) => match rejection {
                PathRejection::FailedToDeserializePathParams(inner) => {
                    let mut status_code = StatusCode::BAD_REQUEST;
                    let kind = inner.into_kind();

                    match &kind {
                        ErrorKind::WrongNumberOfParameters { .. } => {
                            Self::into_json_response(status_code, kind.to_string(), None)
                        }
                        ErrorKind::ParseErrorAtKey { key, .. } => Self::into_json_response(
                            status_code,
                            kind.to_string(),
                            Some(key.clone()),
                        ),
                        ErrorKind::ParseErrorAtIndex { index, .. } => Self::into_json_response(
                            status_code,
                            kind.to_string(),
                            Some(index.to_string()),
                        ),
                        ErrorKind::ParseError { .. } => {
                            Self::into_json_response(status_code, kind.to_string(), None)
                        }
                        ErrorKind::InvalidUtf8InPathParam { key } => Self::into_json_response(
                            status_code,
                            kind.to_string(),
                            Some(key.clone()),
                        ),
                        ErrorKind::UnsupportedType { .. } => {
                            // this error is caused by the programmer using an unsupported type
                            // (such as nested maps) so respond with `500` instead
                            status_code = StatusCode::INTERNAL_SERVER_ERROR;
                            Self::into_json_response(status_code, kind.to_string(), None)
                        }
                        ErrorKind::DeserializeError {
                            key,
                            value,
                            message,
                        } => {
                            status_code = StatusCode::INTERNAL_SERVER_ERROR;
                            Self::into_json_response(
                                status_code,
                                message.clone(),
                                Some(key.clone()),
                            )
                        }
                        ErrorKind::Message(msg) => {
                            Self::into_json_response(status_code, msg.clone(), None)
                        }
                        _ => Self::into_json_response(
                            status_code,
                            format!("Unhandled deserialization error: {kind}"),
                            None,
                        ),
                    }
                }
                PathRejection::MissingPathParams(rejection) => {
                    Self::into_json_response(StatusCode::BAD_REQUEST, rejection.to_string(), None)
                }
                _ => Self::into_json_response(
                    StatusCode::BAD_REQUEST,
                    format!("Unhandled path rejection: {rejection}"),
                    None,
                ),
            },
            ParserRejection::QueryRejection(rejection) => match rejection {
                QueryRejection::FailedToDeserializeQueryString(inner) => {
                    Self::into_json_response(StatusCode::BAD_REQUEST, inner.body_text(), None)
                }
                _ => Self::into_json_response(
                    StatusCode::BAD_REQUEST,
                    format!("Unhandled query rejection: {rejection}"),
                    None,
                ),
            },
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserRejectionResponse {
    status_code: u16,
    message: String,
    location: Option<String>,
}
