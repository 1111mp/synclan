// use super::tray::Tray;
use anyhow::Result;
use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use std::sync::Arc;
use tauri::{AppHandle, Manager, WebviewWindow};

#[derive(Debug, Default, Clone)]
pub struct Handle {
    pub app_handle: Arc<RwLock<Option<AppHandle>>>,
}

impl Handle {
    pub fn global() -> &'static Handle {
        static HANDLE: OnceCell<Handle> = OnceCell::new();

        HANDLE.get_or_init(|| Handle {
            app_handle: Arc::new(RwLock::new(None)),
        })
    }

    pub fn init(&self, app_handle: &AppHandle) {
        let mut handle = self.app_handle.write();
        *handle = Some(app_handle.clone());
    }

    pub fn app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().clone()
    }

    pub fn get_window(&self) -> Option<WebviewWindow> {
        let app_handle = self.app_handle().unwrap();
        let window: Option<WebviewWindow> = app_handle.get_webview_window("main");
        if window.is_none() {
            log::debug!(target:"app", "main window not found");
        }
        window
    }

    // /// update the system tray state
    // pub fn update_systray_part() -> Result<()> {
    //     Tray::update_part()?;
    //     Ok(())
    // }

    // /// update the system tray state & emit event
    // pub fn update_systray_part_with_emit(event: &str, version: &str) -> Result<()> {
    //     Tray::update_part_with_emit(event, version)?;
    //     Ok(())
    // }
}
