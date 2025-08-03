// use crate::guards::APP_AUTH_KEY;
use utoipa::{
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
    Modify, OpenApi,
};

pub const SYNCLAN_TAG: &str = "Synclan";
pub const USER_TAG: &str = "User";
pub const UPLOAD_TAG: &str = "Upload";
pub const MESSAGE_TAG: &str = "Message";

#[derive(OpenApi)]
#[openapi(
	info(title = "Synclan", description = "Synclan api docs"),
  servers(
    (url = "http://127.0.0.1:53317", description = "Local dev server"),
		(url = "http://{domain}:{port}", description = "remote api", 
      variables(
				("domain" = (default = "127.0.0.1", description = "Default domain for API")),
				("port" = (default = "53317", enum_values("53317"), description = "Supported ports for the API"))
			)
    )
  ),
  modifiers(&SecurityAddon),
  tags(
    (name = SYNCLAN_TAG, description = "Synclan application API endpoints"),
    (name = USER_TAG, description = "User API endpoints"),
    (name = UPLOAD_TAG, description = "Upload API endpoints"),
    (name = MESSAGE_TAG, description = "Message API endpoints")
  )
)]
pub struct ApiDoc;

pub struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_schemes_from_iter([(
                "bearer_auth",
                SecurityScheme::Http(HttpBuilder::new().scheme(HttpAuthScheme::Bearer).build()),
            )]);
        }
    }
}
