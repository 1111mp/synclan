use super::AppState;
use axum::Router;
use std::sync::Arc;

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

pub fn router() -> Router<Arc<AppState>> {
    let api_v1_router = Router::new();

    Router::new().nest("v1", api_v1_router)
}
