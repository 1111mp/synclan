import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import type { EditorState } from 'lexical';

import type { EditorStateJSON } from '@/lib/attachment';

export function renderTime(
  time: number,
  t: (key: string) => string,
  locale: string,
) {
  const isZh = locale === 'zh-CN';

  const date = dayjs(time).locale(isZh ? 'zh-cn' : 'en');
  const now = dayjs().locale(isZh ? 'zh-cn' : 'en');

  const isSameYear = date.isSame(now, 'year');
  const daysDiff = now.startOf('day').diff(date.startOf('day'), 'day');

  if (!isSameYear) {
    return date.format('YYYY-MM-DD');
  }

  if (daysDiff === 0) {
    return date.format('HH:mm');
  }

  if (daysDiff === 1) {
    return `${t('time.yesterday')} ${date.format('HH:mm')}`;
  }

  if (daysDiff === 2) {
    return `${t('time.theDayBeforeYesterday')} ${date.format('HH:mm')}`;
  }

  if (daysDiff < 7) {
    return date.format('dddd HH:mm');
  }

  return date.format(isZh ? 'M月D日 HH:mm' : 'MMM D HH:mm');
}

export function renderMessageTime(
  time: number,
  t: (key: string) => string,
  locale: string,
  isNewGroup: boolean = false,
) {
  if (isNewGroup) {
    return renderTime(time, t, locale);
  }
  return dayjs(time).format('HH:mm');
}

export function isSameDay(time: number, diffTime?: number) {
  if (!diffTime) {
    return false;
  }

  const date = dayjs(time);
  const diffDate = dayjs(diffTime);
  if (!date.isValid() || !diffDate.isValid()) {
    return false;
  }

  return date.isSame(diffDate, 'day');
}

export const THRESHOLD = 5 * 60 * 1000;

export function parseTextMessageContent(content?: string) {
  if (!content) return '';

  try {
    return JSON.parse(content) as EditorState;
  } catch {
    return content;
  }
}

export function parseTextMessageContentForSend(
  content: string,
): EditorStateJSON | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function parseMessageExtra<T>(extra?: string): T | undefined {
  if (!extra) return void 0;

  return JSON.parse(extra) as T;
}
