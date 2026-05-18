/**
 * Unit tests for activity-form-utils.ts — focused on timezone handling.
 *
 * Pins TZ to Asia/Singapore (UTC+8) to ensure consistent date-key results
 * for both Z-suffixed (UTC) and offset-suffixed (+08:00) ISO inputs.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { Settings as LuxonSettings } from 'luxon';

// Pin timezone to UTC+8 for reproducible date boundary tests
beforeAll(() => {
  LuxonSettings.defaultZone = 'Asia/Singapore';
});

import { toDateKey } from './activity-form-utils';

describe('toDateKey — timezone handling', () => {
  it('Case A: +08:00 early-morning timestamp → correct local day', () => {
    // 04:30 AM on 19 May in Singapore = 20:30 UTC previous day
    const result = toDateKey('2026-05-19T04:30:00+08:00');
    expect(result).toBe('2026-05-19');
  });

  it('Case B: equivalent Z (UTC) timestamp → same local day in UTC+8', () => {
    // 20:30 UTC = 04:30 SGT the next calendar day
    const result = toDateKey('2026-05-18T20:30:00.000Z');
    expect(result).toBe('2026-05-19');
  });

  it('Case C: late-evening +08:00 timestamp → same local day', () => {
    const result = toDateKey('2026-05-19T23:30:00+08:00');
    expect(result).toBe('2026-05-19');
  });
});