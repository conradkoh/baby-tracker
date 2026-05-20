/**
 * Shared utility functions for activity pages (create, edit, list).
 *
 * Extracted from duplicated definitions across 7 page files
 * during the activity UI migration.
 */

import { DateTime } from 'luxon';

/** Returns current local datetime as "YYYY-MM-DDTHH:MM" for datetime-local inputs. */
export function getDefaultDatetime(): string {
  return toLocalDatetimeString(Date.now());
}

/**
 * Converts an epoch-ms timestamp or ISO string to a local "YYYY-MM-DDTHH:MM" string
 * for use as the value of a datetime-local input.
 */
export function toLocalDatetimeString(ts: number | string): string {
  const dt = typeof ts === 'number' ? DateTime.fromMillis(ts) : DateTime.fromISO(ts);
  return dt.toLocal().toFormat("yyyy-MM-dd'T'HH:mm");
}

/**
 * Converts a "datetime-local" input string (no timezone) to epoch milliseconds.
 * Luxon treats a no-timezone ISO as local time, so the epoch ms correctly represents
 * the chosen local datetime in UTC.
 */
export function toTimestamp(datetimeLocalValue: string): number {
  return DateTime.fromISO(datetimeLocalValue).toMillis();
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

/**
 * Formats an epoch-ms or ISO timestamp to a short time like "2:30 PM" in local time.
 */
export function formatTime(ts: number | string): string {
  const dt = typeof ts === 'number' ? DateTime.fromMillis(ts) : DateTime.fromISO(ts);
  return dt.toLocal().toFormat('h:mm a');
}

/**
 * Formats an epoch-ms or ISO timestamp to a locale date string like "Jan 15, 2025" in local time.
 */
export function formatDate(ts: number | string): string {
  const dt = typeof ts === 'number' ? DateTime.fromMillis(ts) : DateTime.fromISO(ts);
  return dt.toLocal().toFormat('MMM d, yyyy');
}

/**
 * Extracts the local calendar date (YYYY-MM-DD) from an ISO timestamp.
 * Uses Luxon to convert to the browser's local timezone.
 * e.g. "2025-05-18T20:30:00.000Z" → "2025-05-19" in UTC+8 (Asia/Singapore),
 * not "2025-05-18".
 * Works with both Z-suffixed (UTC) and offset-suffixed (e.g. +08:00) inputs.
 */
export { toDateKey } from './daily-summary';

/**
 * Converts a diffMs (now - timestampMs) into a human-readable "time ago" string.
 * Used by both page.tsx and DailySummaryCard.
 */
export function timeAgoFromMs(diffMs: number): string {
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}min ago` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Alias for timeAgoFromMs — used in DailySummaryCard for agoMs fields
 * (lastWetAgoMs etc.) where the diff is already computed as (now - timestampMs).
 */
export const humanizeAgo = timeAgoFromMs;
