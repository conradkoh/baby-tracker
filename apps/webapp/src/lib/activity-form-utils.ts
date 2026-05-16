/**
 * Shared utility functions for activity pages (create, edit, list).
 *
 * Extracted from duplicated definitions across 7 page files
 * during the activity UI migration.
 */

/** Returns current datetime as ISO string truncated to minutes (YYYY-MM-DDTHH:MM). */
export function getDefaultDatetime(): string {
  return new Date().toISOString().slice(0, 16);
}

/** Converts minutes + seconds to total seconds. */
export function toSeconds(min: number, sec: number): number {
  return min * 60 + sec;
}

/** Converts total seconds to { min, sec }. */
export function toMinutesSeconds(totalSeconds: number): { min: number; sec: number } {
  return {
    min: Math.floor(totalSeconds / 60),
    sec: totalSeconds % 60,
  };
}

/** Formats total seconds as "X min Y sec" string. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

/** Formats an ISO timestamp to a short time like "2:30 PM". */
export function formatTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Formats a timestamp to a locale date string like "Jan 15, 2025". */
export function formatDate(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Extracts YYYY-MM-DD from an ISO timestamp. */
export function toDateKey(ts: string): string {
  return ts.slice(0, 10);
}
