import dayjs from 'dayjs';

export function renderTime(time: number) {
  const date = dayjs(time),
    now = dayjs(),
    diff = now.diff(date, 'day');

  if (diff < 1) {
    return now.isSame(date, 'day')
      ? date.format('HH:mm')
      : date.format('[昨天] HH:mm');
  }

  if (diff < 2) {
    return date.isSame(now.subtract(1, 'day'))
      ? date.format('[昨天] HH:mm')
      : date.format('dddd HH:mm');
  }

  if (diff < 7) {
    return date.format('dddd HH:mm');
  }

  return date.format('YYYY-MM-DD');
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

export const MEDIA_MAX_WIDTH = 640;

export function parseMessageExtra<T>(extra?: string): T | undefined {
  if (!extra) return void 0;

  return JSON.parse(extra) as T;
}
