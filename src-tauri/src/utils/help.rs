use crate::{logging, utils::logging::Type};
use anyhow::{anyhow, bail, Context, Result};
use serde::{de::DeserializeOwned, Serialize};
use serde_yaml::Mapping;
use std::{fs, path::PathBuf};

/// read data from yaml as struct T
pub fn read_yaml<T: DeserializeOwned>(path: &PathBuf) -> Result<T> {
    if !path.exists() {
        bail!("file not found \"{}\"", path.display());
    }

    let yaml_content = fs::read_to_string(path)
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))?;
    serde_yaml::from_str::<T>(&yaml_content).with_context(|| {
        format!(
            "failed to read the file with yaml format \"{}\"",
            path.display()
        )
    })
}

/// save the data to the file
/// can set `prefix` string to add some comments
pub fn save_yaml<T: Serialize>(path: &PathBuf, data: &T, prefix: Option<&str>) -> Result<()> {
    let data_content = serde_yaml::to_string(data)?;

    let yaml_content = match prefix {
        Some(prefix) => format!("{prefix}\n\n{data_content}"),
        None => data_content,
    };

    let path_str = path.as_os_str().to_string_lossy().to_string();
    fs::write(path, yaml_content.as_bytes())
        .with_context(|| format!("failed to save file \"{path_str}\""))
}

/// read mapping from yaml
pub fn read_mapping(path: &PathBuf) -> Result<Mapping> {
    if !path.exists() {
        bail!("file not found \"{}\"", path.display());
    }

    let yaml_str = fs::read_to_string(path)
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))?;

    // YAML语法检查
    match serde_yaml::from_str::<serde_yaml::Value>(&yaml_str) {
        Ok(mut val) => {
            val.apply_merge()
                .with_context(|| format!("failed to apply merge \"{}\"", path.display()))?;

            Ok(val
                .as_mapping()
                .ok_or(anyhow!(
                    "failed to transform to yaml mapping \"{}\"",
                    path.display()
                ))?
                .to_owned())
        }
        Err(err) => {
            let error_msg = format!("YAML syntax error in {}: {}", path.display(), err);
            logging!(error, Type::Config, true, "{}", error_msg);

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
