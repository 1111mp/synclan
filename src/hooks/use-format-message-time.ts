import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';

export function useFormatMessageTime() {
  const { i18n, t } = useTranslation();

  return (time?: string | number | Date) => {
    if (!time) return '';

    const date = dayjs(time);
    const now = dayjs();

    const locale = i18n.language === 'zh-CN' ? 'zh-cn' : 'en';

    dayjs.locale(locale);

    if (date.isSame(now, 'day')) {
      return date.format('HH:mm');
    }

    if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return t('time.yesterday');
    }

    if (date.isSame(now, 'week')) {
      return date.locale(locale).format('ddd');
    }

    if (date.isSame(now, 'year')) {
      return date.format('MM-DD');
    }

    return date.format('YYYY-MM-DD');
  };
}
