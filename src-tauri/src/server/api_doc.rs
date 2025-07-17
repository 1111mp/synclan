// use crate::guards::APP_AUTH_KEY;
use utoipa::{
    openapi::security::{ApiKey, ApiKeyValue, SecurityScheme},
    Modify, OpenApi,
};

pub const USER_TAG: &str = "User";
pub const UPLOAD_TAG: &str = "Upload";

#[derive(OpenApi)]
#[openapi(
	info(description = "App api docs"),
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
    (name = USER_TAG, description = "User API endpoints"),
    (name = UPLOAD_TAG, description = "Upload API endpoints")
  )
)]
pub struct ApiDoc;

pub struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_schemes_from_iter([
                // (
                //     "cookie_security",
                //     SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new(APP_AUTH_KEY.as_str()))),
                // ),
                (
                    "header_security",
                    SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new("PRIVATE-TOKEN"))),
                ),
            ]);
        }
    }
}
