use super::{logging_error, Type};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HttpException {
    /// 400
    #[error("Bad Request")]
    BadRequestException(Option<String>),
    /// 401
    #[error("Unauthorized")]
    UnauthorizedException(Option<String>),
    /// 403
    #[error("Forbidden")]
    ForbiddenException(Option<String>),
    /// 404
    #[error("Not Found")]
    NotFoundException(Option<String>),
    /// 405
    #[error("Method Not Allowed")]
    MethodNotAllowedException(Option<String>),
    /// 406
    #[error("Not Acceptable")]
    NotAcceptableException(Option<String>),
    /// 408
    #[error("Request Timeout")]
    RequestTimeoutException(Option<String>),
    /// 409
    #[error("Conflict")]
    ConflictException(Option<String>),
    /// 410
    #[error("Gone")]
    GoneException(Option<String>),
    /// 412
    #[error("Precondition Failed")]
    PreconditionFailedException(Option<String>),
    /// 413
    #[error("Payload Too Large")]
    PayloadTooLargeException(Option<String>),
    /// 415
    #[error("Unsupported Media Type")]
    UnsupportedMediaTypeException(Option<String>),
    /// 418
    #[error("I'm a teapot")]
    ImATeapotException(Option<String>),
    /// 422
    #[error("Unprocessable Entity")]
    UnprocessableEntityException(Option<String>),
    /// 500
    #[error("Internal Server Error")]
    InternalServerErrorException(Option<String>),
    /// 501
    #[error("Not Implemented")]
    NotImplementedException(Option<String>),
    /// 502
    #[error("Bad Gateway")]
    BadGatewayException(Option<String>),
    /// 503
    #[error("Service Unavailable")]
    ServiceUnavailableException(Option<String>),
    /// 504
    #[error("Gateway Timeout")]
    GatewayTimeoutException(Option<String>),
    /// 505
    #[error("HTTP Version Not Supported")]
    HttpVersionNotSupportedException(Option<String>),
}

impl HttpException {
    fn status_and_default_message(&self) -> (StatusCode, &'static str) {
        match self {
            HttpException::BadRequestException(_) => (StatusCode::BAD_REQUEST, "Bad Request"),
            HttpException::UnauthorizedException(_) => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            HttpException::ForbiddenException(_) => (StatusCode::FORBIDDEN, "Forbidden"),
            HttpException::NotFoundException(_) => (StatusCode::NOT_FOUND, "Not Found"),
            HttpException::MethodNotAllowedException(_) => {
                (StatusCode::METHOD_NOT_ALLOWED, "Method Not Allowed")
            }
            HttpException::NotAcceptableException(_) => {
                (StatusCode::NOT_ACCEPTABLE, "Not Acceptable")
            }
            HttpException::RequestTimeoutException(_) => {
                (StatusCode::REQUEST_TIMEOUT, "Request Timeout")
            }
            HttpException::ConflictException(_) => (StatusCode::CONFLICT, "Conflict"),
            HttpException::GoneException(_) => (StatusCode::GONE, "Gone"),
            HttpException::PreconditionFailedException(_) => {
                (StatusCode::PRECONDITION_FAILED, "Precondition Failed")
            }
            HttpException::PayloadTooLargeException(_) => {
                (StatusCode::PAYLOAD_TOO_LARGE, "Payload Too Large")
            }
            HttpException::UnsupportedMediaTypeException(_) => {
                (StatusCode::UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type")
            }
            HttpException::ImATeapotException(_) => (StatusCode::IM_A_TEAPOT, "I'm a teapot"),
            HttpException::UnprocessableEntityException(_) => {
                (StatusCode::UNPROCESSABLE_ENTITY, "Unprocessable Entity")
            }
            HttpException::InternalServerErrorException(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")
            }
            HttpException::NotImplementedException(_) => {
                (StatusCode::NOT_IMPLEMENTED, "Not Implemented")
            }
            HttpException::BadGatewayException(_) => (StatusCode::BAD_GATEWAY, "Bad Gateway"),
            HttpException::ServiceUnavailableException(_) => {
                (StatusCode::SERVICE_UNAVAILABLE, "Service Unavailable")
            }
            HttpException::GatewayTimeoutException(_) => {
                (StatusCode::GATEWAY_TIMEOUT, "Gateway Timeout")
            }
            HttpException::HttpVersionNotSupportedException(_) => (
                StatusCode::HTTP_VERSION_NOT_SUPPORTED,
                "HTTP Version Not Supported",
            ),
        }
    }
}

impl IntoResponse for HttpException {
    fn into_response(self) -> Response {
        let (status, default_message) = self.status_and_default_message();

        // Use custom message if any, otherwise use default message
        let message = match self {
            HttpException::BadRequestException(Some(msg))
            | HttpException::UnauthorizedException(Some(msg))
            | HttpException::ForbiddenException(Some(msg))
            | HttpException::NotFoundException(Some(msg))
            | HttpException::MethodNotAllowedException(Some(msg))
            | HttpException::NotAcceptableException(Some(msg))
            | HttpException::RequestTimeoutException(Some(msg))
            | HttpException::ConflictException(Some(msg))
            | HttpException::GoneException(Some(msg))
            | HttpException::PreconditionFailedException(Some(msg))
            | HttpException::PayloadTooLargeException(Some(msg))
            | HttpException::UnsupportedMediaTypeException(Some(msg))
            | HttpException::ImATeapotException(Some(msg))
            | HttpException::UnprocessableEntityException(Some(msg))
            | HttpException::InternalServerErrorException(Some(msg))
            | HttpException::NotImplementedException(Some(msg))
            | HttpException::BadGatewayException(Some(msg))
            | HttpException::ServiceUnavailableException(Some(msg))
            | HttpException::GatewayTimeoutException(Some(msg))
            | HttpException::HttpVersionNotSupportedException(Some(msg)) => msg,
            _ => default_message.to_string(),
        };

        let body = axum::Json(ExceptionResponse {
            status_code: status.as_u16(),
            message,
        });

        (status, body).into_response()
    }
}

impl From<std::io::Error> for HttpException {
    fn from(err: std::io::Error) -> Self {
        logging_error!(Type::Server, true, "{}", err);
        HttpException::InternalServerErrorException(Some(err.to_string()))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExceptionResponse {
    status_code: u16,
    message: String,
}

#[macro_export]
macro_rules! http_exception {
    ($variant:ident) => {
        return Err(HttpException::$variant(None))
    };
    ($variant:ident, $msg:expr) => {
        let msg = $msg.map(|s| s.to_string());
        return Err(HttpException::$variant(msg))
    };
}

#[macro_export]
macro_rules! http_exception_or {
    ($expr:expr, $variant:ident, $msg:expr) => {
        match $expr {
            Some(val) => val,
            None => return Err(HttpException::$variant(Some($msg.to_string()))),
        }
    };
    ($result:expr, $variant:ident) => {
        match $result {
            Ok(val) => val,
            Err(err) => return Err(HttpException::$variant(Some(err.to_string()))),
        }
    };
}
