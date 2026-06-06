use crate::{config::with_encryption, logging, utils::logging::Type};
use anyhow::{anyhow, bail, Context, Result};
use serde::{de::DeserializeOwned, Serialize};
use serde_yaml_ng::{Mapping, Value};
use std::{fs, path::PathBuf};

/// read data from yaml as struct T
pub async fn read_yaml<T: DeserializeOwned>(path: &PathBuf) -> Result<T> {
    if !tokio::fs::try_exists(path).await.unwrap_or(false) {
        bail!("file not found \"{}\"", path.display());
    }

    let yaml_str = tokio::fs::read_to_string(path).await?;

    Ok(with_encryption(|| async { serde_yaml_ng::from_str::<T>(&yaml_str) }).await?)
}

/// save the data to the file
/// can set `prefix` string to add some comments
pub async fn save_yaml<T: Serialize + Sync>(
    path: &PathBuf,
    data: &T,
    prefix: Option<&str>,
) -> Result<()> {
    let data_str = with_encryption(|| async { serde_yaml_ng::to_string(data) }).await?;

    let yaml_str = match prefix {
        Some(prefix) => format!("{prefix}\n\n{data_str}"),
        None => data_str,
    };

    tokio::fs::write(path, yaml_str.as_bytes())
        .await
        .with_context(|| format!("failed to save file \"{}\"", path.display()))?;
    // tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    Ok(())
}

/// read mapping from yaml
pub async fn read_mapping(path: &PathBuf) -> Result<Mapping> {
    if !tokio::fs::try_exists(path).await.unwrap_or(false) {
        bail!("file not found \"{}\"", path.display());
    }

    let yaml_str = tokio::fs::read_to_string(path)
        .await
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))?;

    // YAML语法检查
    match serde_yaml_ng::from_str::<Value>(&yaml_str) {
        Ok(mut val) => {
            val.apply_merge()
                .with_context(|| format!("failed to apply merge \"{}\"", path.display()))?;

            match val {
                Value::Mapping(map) => Ok(map),
                _ => Err(anyhow!(
                    "failed to transform to yaml mapping \"{}\"",
                    path.display()
                )),
            }
        }
        Err(err) => {
            let error_msg = format!("YAML syntax error in {}: {}", path.display(), err);
            logging!(error, Type::Config, "{}", error_msg);

            bail!("YAML syntax error: {}", err)
        }
    }
}

/// get system theme
/// return `tauri::Theme::Dark` or `tauri::Theme::Light`
pub fn get_system_theme() -> tauri::Theme {
    match dark_light::detect() {
        Ok(dark_light::Mode::Dark) => tauri::Theme::Dark,
        Ok(dark_light::Mode::Light) => tauri::Theme::Light,
        _ => tauri::Theme::Light,
    }
}

const APP_LIGHT_COLOR: (u8, u8, u8, u8) = (255, 255, 255, 255);
const APP_DARK_COLOR: (u8, u8, u8, u8) = (47, 47, 47, 255);

/// get the app background color based on system theme
/// return `tauri::webview::Color`
pub fn get_app_background_color() -> tauri::webview::Color {
    let system_theme = get_system_theme();
    let color = match system_theme {
        tauri::Theme::Light => APP_LIGHT_COLOR,
        tauri::Theme::Dark => APP_DARK_COLOR,
        _ => APP_LIGHT_COLOR, // Fallback to light theme color
    };
    color.into()
}
