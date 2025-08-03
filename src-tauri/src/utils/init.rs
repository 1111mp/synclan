use crate::{
    config::{Config, ISynclan},
    utils::{dirs, help},
};

use anyhow::Result;
use chrono::{Local, TimeZone};
use log::LevelFilter;
use log4rs::{
    append::{console::ConsoleAppender, file::FileAppender},
    config::{Appender, Logger, Root},
    encode::pattern::PatternEncoder,
};
use std::{
    fs::{self, DirEntry},
    str::FromStr,
};

/// initialize this instance's log file
fn init_logger() -> Result<()> {
    let log_dir = dirs::app_logs_dir()?;
    if !log_dir.exists() {
        let _ = fs::create_dir_all(&log_dir);
    }

    // read from config
    let log_level = Config::synclan().latest_ref().get_log_level();
    if log_level == LevelFilter::Off {
        return Ok(());
    }

    let local_time = Local::now().format("%Y-%m-%d-%H%M").to_string();
    let log_file = format!("{}.log", local_time);
    let log_file = log_dir.join(log_file);

    let log_pattern = match log_level {
        LevelFilter::Trace => "{d(%Y-%m-%d %H:%M:%S)} {l} [{M}] - {m}{n}",
        _ => "{d(%Y-%m-%d %H:%M:%S)} {l} - {m}{n}",
    };

    let encode = Box::new(PatternEncoder::new(log_pattern));

    let stdout = ConsoleAppender::builder().encoder(encode.clone()).build();
    let tofile = FileAppender::builder().encoder(encode).build(log_file)?;

    let mut logger_builder = Logger::builder();
    let mut root_builder = Root::builder();

    let log_more = log_level == LevelFilter::Trace || log_level == LevelFilter::Debug;

    logger_builder = logger_builder.appenders(["file"]);
    if log_more {
        root_builder = root_builder.appenders(["file"]);
    }

    let (config, _) = log4rs::config::Config::builder()
        .appender(Appender::builder().build("stdout", Box::new(stdout)))
        .appender(Appender::builder().build("file", Box::new(tofile)))
        .logger(logger_builder.additive(false).build("app", log_level))
        .build_lossy(root_builder.build(log_level));

    log4rs::init_config(config)?;

    Ok(())
}

/// delete the log file
pub fn delete_log_file() -> Result<()> {
    let log_dir = dirs::app_logs_dir()?;
    if !log_dir.exists() {
        return Ok(());
    }

    let auto_log_clean = {
        let synclan = Config::synclan();
        let synclan = synclan.latest_ref();
        synclan.auto_log_clean.unwrap_or(0)
    };

    let day = match auto_log_clean {
        1 => 7,
        2 => 30,
        3 => 90,
        _ => return Ok(()),
    };

    log::debug!(target: "app", "try to delete log files, day: {day}");

    // %Y-%m-%d to NaiveDateTime
    let parse_time_str = |s: &str| {
        let sa: Vec<&str> = s.split('-').collect();
        if sa.len() != 4 {
            return Err(anyhow::anyhow!("invalid time str"));
        }

        let year = i32::from_str(sa[0])?;
        let month = u32::from_str(sa[1])?;
        let day = u32::from_str(sa[2])?;
        let time = chrono::NaiveDate::from_ymd_opt(year, month, day)
            .ok_or(anyhow::anyhow!("invalid time str"))?
            .and_hms_opt(0, 0, 0)
            .ok_or(anyhow::anyhow!("invalid time str"))?;
        Ok(time)
    };

    let process_file = |file: DirEntry| -> Result<()> {
        let file_name = file.file_name();
        let file_name = file_name.to_str().unwrap_or_default();

        if file_name.ends_with(".log") {
            let now = Local::now();
            let created_time = parse_time_str(&file_name[0..file_name.len() - 4])?;
            let file_time = Local
                .from_local_datetime(&created_time)
                .single()
                .ok_or(anyhow::anyhow!("invalid local datetime"))?;

            let duration = now.signed_duration_since(file_time);
            if duration.num_days() > day {
                let file_path = file.path();
                let _ = fs::remove_file(file_path);
                log::info!(target: "app", "delete log file: {file_name}");
            }
        }
        Ok(())
    };

    for file in fs::read_dir(&log_dir)?.flatten() {
        let _ = process_file(file);
    }

    let service_log_dir = log_dir.join("service");
    for file in fs::read_dir(service_log_dir)?.flatten() {
        let _ = process_file(file);
    }

    Ok(())
}

/// Initialize all the config files before tauri setup
pub fn init_config() -> Result<()> {
    let _ = init_logger();
    let _ = delete_log_file();

    crate::log_err!(dirs::app_home_dir().map(|app_dir| {
        if !app_dir.exists() {
            let _ = fs::create_dir_all(&app_dir);
        }
    }));

    crate::log_err!(dirs::file_upload_dir().map(|app_dir| {
        if !app_dir.exists() {
            let _ = fs::create_dir_all(&app_dir);
        }
    }));

    crate::log_err!(dirs::synclan_path().map(|path| {
        if !path.exists() {
            help::save_yaml(&path, &ISynclan::template(), Some("# SyncLan Config File"))?;
        }
        <Result<()>>::Ok(())
    }));

    Ok(())
}
