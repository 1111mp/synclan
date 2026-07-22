import dayjs from 'dayjs';
import type { EditorState } from 'lexical';

import type { EditorStateJSON } from '@/lib/attachment';

export function renderTime(time: number) {
  const date = dayjs(time),
    now = dayjs(),
    isSameYear = date.isSame(now, 'year'),
    daysDiff = now.startOf('day').diff(date.startOf('day'), 'day');

  if (isSameYear) {
    if (daysDiff === 0) {
      return date.format('HH:mm');
    }

    if (daysDiff === 1) {
      return date.format('昨天 HH:mm');
    }

    if (daysDiff === 2) {
      return date.format('前天 HH:mm');
    }

    if (daysDiff < 7) {
      return date.format('dddd HH:mm');
    }

    return date.format('M月D日 HH:mm');
  }

  return date.format('YYYY-MM-DD');
}

export function renderMessageTimee(time: number, isNewGroup: boolean = false) {
  if (isNewGroup) {
    return renderTime(time);
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
