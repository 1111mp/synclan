interface ISynclanConfig {
  app_log_level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | string;
  locale?: string;
  theme?: 'light' | 'dark' | 'system';
  enable_auto_launch?: boolean;
  enable_silent_start?: boolean;
  auto_check_update?: boolean;
  auto_log_clean?: 0 | 1 | 2 | 3 | 4;
  enable_random_port?: boolean;
  enable_encryption?: boolean;
}
