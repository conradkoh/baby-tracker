import { useState, useEffect } from 'react';

export function roundUpToNext5Min(ms: number): number {
  const boundary = Math.ceil(ms / 300_000) * 300_000;
  if (boundary === ms) return ms + 300_000;
  return boundary;
}

export function useNowBucket5Min(): number {
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

  return bucket;
}