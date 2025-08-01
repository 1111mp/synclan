import { clamp } from 'lodash-es';

export const MIN_WIDTH = 97;
export const SNAP_WIDTH = 200;
export const MIN_FULL_WIDTH = 280;
export const MAX_WIDTH = 380;

export function getWidthFromPreferredWidth(
  preferredWidth: number,
  { requiresFullWidth }: { requiresFullWidth: boolean },
): number {
  const clampedWidth = clamp(preferredWidth, MIN_WIDTH, MAX_WIDTH);

  if (requiresFullWidth || clampedWidth >= SNAP_WIDTH) {
    return Math.max(clampedWidth, MIN_FULL_WIDTH);
  }

  return MIN_WIDTH;
}

export enum WidthBreakpoint {
  Wide = 'wide',
  Medium = 'medium',
  Narrow = 'narrow',
}

export function getNavSidebarWidthBreakpoint(width: number): WidthBreakpoint {
  return width >= 150 ? WidthBreakpoint.Wide : WidthBreakpoint.Narrow;
}
