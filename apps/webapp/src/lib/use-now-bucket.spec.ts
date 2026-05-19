import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { roundUpToNext5Min, useNowBucket5Min } from './use-now-bucket';

describe('roundUpToNext5Min', () => {
  it('rounds mid-bucket up to next boundary', () => {
    const result = roundUpToNext5Min(1000);
    expect(result).toBe(300_000);
  });

  it('keeps exact boundary unchanged (returns + 5min)', () => {
    const boundary = 300_000;
    const result = roundUpToNext5Min(boundary);
    expect(result).toBe(boundary + 300_000);
  });

  it('handles large timestamps', () => {
    const large = 1_735_204_800_000;
    const result = roundUpToNext5Min(large);
    expect(result % 300_000).toBe(0);
    expect(result).toBeGreaterThan(large);
  });
});

describe('useNowBucket5Min', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns ISO string with UTC zone', () => {
    vi.setSystemTime(new Date('2025-01-15T12:03:00.000Z'));
    const { result } = renderHook(() => useNowBucket5Min());
    expect(result.current).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
  });
});