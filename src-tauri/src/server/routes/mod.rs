mod message;
mod synclan;
mod upload;
mod user;

use crate::server::guards::AuthGuard;

use super::AppState;
use axum::{
    http::StatusCode,
    middleware,
    response::{IntoResponse, Redirect, Response},
};
use serde::Serialize;
use std::sync::Arc;
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;

/**
 *  https://docs.rs/axum/latest/axum/middleware/index.html#ordering
 *  The public router and protected router depend on the execution order of middleware
 *
 * 	Router::new()
 *  .merge(routes::user::create_protected_route())
 *  .route_layer(middleware::from_fn(middlewares::cookie_auth::cookie_guard))
 *  .merge(routes::user::create_public_route()),
 *
 *              requests
 *                 |
 *                 v
 *   +-------- public_route -------+
 *   | +------ cookie_auth ------+ |
 *   | | +-- protected_route --+ | |
 *   | | |                     | | |
 *   | | |       handler       | | |
 *   | | |                     | | |
 *   | | +-- protected_route --+ | |
 *   | +------ cookie_auth ------+ |
 *   +-------- public_route -------+
 *                 |
 *                 v
 *             responses
 */

pub fn router() -> OpenApiRouter<Arc<AppState>> {
    let api_v1_router = OpenApiRouter::new()
        .merge(message::protected_route())
        .merge(upload::protected_route())
        .route_layer(middleware::from_extractor::<AuthGuard>())
        .merge(synclan::public_route())
        .merge(user::public_route());

    OpenApiRouter::new().nest("/v1", api_v1_router)
}

enum HttpResponse<T> {
    Json {
        payload: Option<T>,
        message: Option<String>,
    },

    RedirectTo {
        uri: String,
    },
}

impl<T: Serialize> IntoResponse for HttpResponse<T> {
    fn into_response(self) -> Response {
        match self {
            HttpResponse::Json { payload, message } => {
                let status = StatusCode::OK;
                let body = JsonResponse {
                    status_code: status.as_u16(),
                    payload,
                    message,
                };
                (status, axum::Json(body)).into_response()
            }
            HttpResponse::RedirectTo { uri } => Redirect::temporary(&uri).into_response(),
        }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct JsonResponse<T> {
    #[schema(example = 200)]
    status_code: u16,
    payload: T,
    message: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct EmptyPayload;

#[macro_export]
macro_rules! json_response {
    ($payload:expr) => {
        return Ok(HttpResponse::Json {
            payload: $payload,
            message: None,
        })
    };
    ($payload:expr, $message:expr) => {
        return Ok(HttpResponse::Json {
            payload: $payload,
            message: Some($message.to_string()),
        })
    };
}
