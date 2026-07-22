type AppBaseTheme = 'light' | 'dark';
type AppTheme = AppBaseTheme | 'system';

type AppLocale = 'en' | 'zh-CN';

interface ISynclanConfig {
  locale?: AppLocale;
  theme: AppTheme;
  enable_auto_launch?: boolean;
  enable_silent_start?: boolean;
  auto_check_update?: boolean;
  // server
  http_server_port?: number;
  enable_encryption?: boolean;
  enable_random_port?: boolean;
  // storage
  file_upload_dir?: string;
  auto_file_clean?: 0 | 1 | 2 | 3 | 4;
  // log
  app_log_level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
  app_log_max_size?: number;
  app_log_max_count?: number;
  auto_log_clean?: 0 | 1 | 2 | 3 | 4;
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

type LastMessage = Omit<IMessage, 'content'>;

interface IConversations {
  id: string; // 设备/会话 ID (主键)
  device?: IDevice | null;
  unreadCount: number;
  lastAccessed: number;
  lastMessage?: LastMessage;
}

type Attachment = {
  id: string;
  src: string;
  name: string;
};
