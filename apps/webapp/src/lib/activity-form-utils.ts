/**
 * Shared utility functions for activity pages (create, edit, list).
 *
 * Extracted from duplicated definitions across 7 page files
 * during the activity UI migration.
 */

import { DateTime } from 'luxon';

/** Returns current local datetime as "YYYY-MM-DDTHH:MM" for datetime-local inputs. */
export function getDefaultDatetime(): string {
  return toLocalDatetimeString(new Date().toISOString());
}

/**
 * Converts an ISO timestamp (UTC or offset) to a local "YYYY-MM-DDTHH:MM" string
 * for use as the value of a datetime-local input.
 * Mirrors how the mobile pre-populates edit forms.
 */
export function toLocalDatetimeString(isoTs: string): string {
  return DateTime.fromISO(isoTs).toLocal().toFormat("yyyy-MM-dd'T'HH:mm");
}

/**
 * Converts a "datetime-local" input string (no timezone) to a timezone-aware ISO string.
 * Luxon treats a no-timezone ISO as local time, then .toISO() adds the offset.
 * Mirrors how mobile uses DateTime.fromJSDate(date).toISO() on submit.
 */
export function toTimestamp(datetimeLocalValue: string): string {
  return DateTime.fromISO(datetimeLocalValue).toISO()!;
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

/** Extracts YYYY-MM-DD from an ISO timestamp.
 * For timestamps with timezone offset (e.g. +08:00), this gives the local date.
 * All production records use the +08:00 format after migration.
 */
export function toDateKey(ts: string): string {
  return ts.slice(0, 10);
}
