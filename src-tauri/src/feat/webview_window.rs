use crate::module::message::MessageType;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::{utils::config::WindowConfig, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Deserialize, Serialize)]
pub struct PreviewContext {
    current: usize,
    list: Vec<PreviewCore>,
}

#[derive(Debug, Deserialize, Serialize)]
struct PreviewCore {
    #[serde(rename = "type")]
    r#type: MessageType,
    url: String,
    width: Option<f64>,
    height: Option<f64>,
}

pub fn create_preview_window(
    app_handle: &tauri::AppHandle,
    config: WindowConfig,
    context: PreviewContext,
) -> Result<()> {
    WebviewWindowBuilder::from_config(
        app_handle,
        &WindowConfig {
            label: "preview".into(),
            url: WebviewUrl::App("preview/index.html".into()),
            ..config
        },
    )?
    .initialization_script(format!(
        "window.__SYNCLAN__PREVIEW__INIT_DATA__ = {};",
        serde_json::to_string(&context)?
    ))
    .center()
    .visible(true)
    .build()?;

    Ok(())
}
