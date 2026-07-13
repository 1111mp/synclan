import { isWeb } from '@/lib/constant';
import { z } from '@/lib/zod';

const commonSchema = z.object({
  theme: z.enum(['system', 'dark', 'light']),
  locale: z.enum(['zh-CN', 'en']),
});

const tauriSchema = {
  // general
  auto_check_update: z.boolean(),
  enable_auto_launch: z.boolean(),
  enable_silent_start: z.boolean(),
  // server
  http_server_port: z.number().int().min(3000).max(65535),
  enable_encryption: z.boolean(),
  // storage
  file_upload_dir: z.string().min(1),
  auto_file_clean: z.enum(['0', '1', '2', '3', '4']),
  // log
  app_log_level: z.enum(['silent', 'error', 'warn', 'info', 'debug', 'trace']),
  auto_log_clean: z.enum(['0', '1', '2', '3', '4']),
  app_log_max_size: z.number().min(1),
  app_log_max_count: z.number().min(1),
};

const tauriExtendedSchema = commonSchema.extend(tauriSchema);
const formSchema = (isWeb ? commonSchema : tauriExtendedSchema) as
  | typeof commonSchema
  | typeof tauriExtendedSchema;

type SettingsForm = z.infer<typeof formSchema>;

export { formSchema, type SettingsForm };
