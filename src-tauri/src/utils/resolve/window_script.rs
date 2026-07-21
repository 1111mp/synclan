pub fn build_window_initial_script(synclan_settings: &str, resolved_theme: &str) -> String {
    let script = r##"
      if (sessionStorage.getItem('__SYNCLAN_INITIAL__') === null) {
          sessionStorage.setItem('__SYNCLAN_INITIAL__', 'no');
      }
    "##;

    format!(
        r##"
        window.__SYNCLAN_PLATFORM__ = "tauri";
        document.documentElement.dataset.platform = "tauri";
        window.__SYNCLAN_INITIAL_SETTINGS__ = {synclan_settings};
        window.__SYNCLAN_INITIAL_THEME__ = "{resolved_theme}";
        {script}
        "##,
        synclan_settings = synclan_settings,
        resolved_theme = resolved_theme,
        script = script
    )
}
