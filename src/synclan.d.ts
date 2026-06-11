type AppBaseTheme = 'light' | 'dark';
type AppTheme = AppBaseTheme | 'system';

interface ISynclanConfig {
  app_log_level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  locale?: string;
  theme: AppTheme;
  enable_auto_launch?: boolean;
  enable_silent_start?: boolean;
  auto_check_update?: boolean;
  auto_log_clean?: 0 | 1 | 2 | 3 | 4;
  enable_random_port?: boolean;
  enable_encryption?: boolean;
}

type DeviceRole = 'host' | 'client';

interface IDevice {
  id: string;
  name: string;
  avatar?: string;
  fingerprintId?: string;
  role: DeviceRole;
  platform?: string;
  browser?: string;
  createdAt: number;
  updatedAt: number;
}
