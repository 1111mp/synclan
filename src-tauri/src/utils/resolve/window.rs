use crate::{config::Config, core::handle, utils::resolve::window_script::build_window_initial_script};
use anyhow::Result;
use dark_light::{Mode as SystemTheme, detect as detect_system_theme};
use tauri::{Theme, WebviewWindow, window::Color};

const DARK_BACKGROUND_COLOR: Color = Color(0, 0, 0, 255); // #000000
const LIGHT_BACKGROUND_COLOR: Color = Color(255, 255, 255, 255); // #ffffff

#[cfg(any(target_os = "windows", target_os = "linux"))]
const DEFAULT_DECORATIONS: bool = false;
#[cfg(target_os = "macos")]
const DEFAULT_DECORATIONS: bool = true;

pub async fn build_new_window() -> Result<WebviewWindow, String> {
    let app_handle = handle::Handle::app_handle();

    let config = Config::synclan().await;
    let scynlan = config.latest_arc();
    let initial_theme_mode = match scynlan.theme.as_deref() {
        Some("dark") => "dark",
        Some("light") => "light",
        _ => "system",
    };

    let system_theme = detect_system_theme().ok();
    let resolved_theme = match initial_theme_mode {
        "dark" => Some(Theme::Dark),
        "light" => Some(Theme::Light),
        _ => match system_theme {
            Some(SystemTheme::Dark) => Some(Theme::Dark),
            Some(SystemTheme::Light) | Some(SystemTheme::Unspecified) | None => Some(Theme::Light),
        },
    };

    let prefers_dark_background = matches!(resolved_theme, Some(Theme::Dark));
    let background_color = if prefers_dark_background {
        DARK_BACKGROUND_COLOR
    } else {
        LIGHT_BACKGROUND_COLOR
    };

    let initial_theme_str = match resolved_theme {
        Some(Theme::Dark) => "dark",
        Some(Theme::Light) => "light",
        _ => "light",
    };

    let synclan_settings_json_str = serde_json::to_string(&scynlan).map_err(|e| e.to_string())?;
    let initial_script = build_window_initial_script(&synclan_settings_json_str, initial_theme_str);

    let mut builder = tauri::WebviewWindowBuilder::new(app_handle, "main", tauri::WebviewUrl::App("index.html".into()))
        .title("SyncLan")
        .decorations(DEFAULT_DECORATIONS)
        // because we use a self-signed certificate
        .additional_browser_args("--ignore-certificate-errors")
        .inner_size(1080.0, 800.0)
        .min_inner_size(750.0, 500.0)
        .background_color(background_color)
        .initialization_script(&initial_script)
        .resizable(true)
        .visible(true)
        .center();

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .hidden_title(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .traffic_light_position(tauri::LogicalPosition::new(11.0, 16.0));
    }

    if let Some(theme) = resolved_theme {
        builder = builder.theme(Some(theme));
    }

    builder = builder.background_color(background_color);

    match builder.build() {
        Ok(window) => {
            // logging_error!(
            //     Type::Window,
            //     window.set_background_color(Some(background_color))
            // );

            #[cfg(debug_assertions)]
            window.open_devtools();

            Ok(window)
        },
        Err(e) => Err(e.to_string()),
    }
}
