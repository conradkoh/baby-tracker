import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

export function roundUpToNext5Min(ms: number): number {
  const boundary = Math.ceil(ms / 300_000) * 300_000;
  if (boundary === ms) return ms + 300_000;
  return boundary;
}

export function useNowBucket5Min(): string {
  const [bucket, setBucket] = useState<number>(() => roundUpToNext5Min(Date.now()));

  useEffect(() => {
    const scheduleNext = () => {
      const next = roundUpToNext5Min(Date.now());
      const delay = next - Date.now();
      const timerId = setTimeout(() => {
        setBucket(roundUpToNext5Min(Date.now()));
        scheduleNext();
      }, Math.max(delay, 0));
      return timerId;
    };

    const timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  // Returns ISO 8601 UTC string (Z suffix) to match the DB storage format.
  // The CreateActivity/UpdateActivity use cases normalise timestamps to UTC,
  // so all query bounds must be in UTC for correct string-index comparison.
  return DateTime.fromMillis(bucket, { zone: 'utc' }).toISO()!;
}