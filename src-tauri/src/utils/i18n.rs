use crate::utils::dirs;
use std::{fs, path::PathBuf};

const DEFAULT_LANGUAGE: &str = "en";

fn get_locales_dir() -> Option<PathBuf> {
    dirs::app_resources_dir()
        .map(|resource_path| resource_path.join("locales"))
        .ok()
}

pub fn get_supported_languages() -> Vec<String> {
    let mut languages = Vec::new();

    if let Some(locales_dir) = get_locales_dir() {
        if let Ok(entries) = fs::read_dir(locales_dir) {
            for entry in entries.flatten() {
                if let Some(file_name) = entry.file_name().to_str() {
                    if let Some(lang) = file_name.strip_suffix(".json") {
                        languages.push(lang.to_string());
                    }
                }
            }
        }
    }

    if languages.is_empty() {
        languages.push(DEFAULT_LANGUAGE.to_string());
    }
    languages
}
