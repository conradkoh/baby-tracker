import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { computeDailySummary } from './daily-summary';

beforeEach(() => {
  // Use fake timers so DateTime.now() returns a frozen clock
  vi.useFakeTimers();
});

function makeFeed(ts: string, subType: string, extras: Record<string, unknown> = {}) {
  return { type: 'feed' as const, timestamp: ts, feed: { type: subType, ...extras } };
}

function makeDiaper(ts: string, diaperType: string) {
  return { type: 'diaper_change' as const, timestamp: ts, diaperChange: { type: diaperType } };
}

function makeTemp(ts: string, value: number) {
  return { type: 'medical' as const, timestamp: ts, medical: { type: 'temperature' as const, temperature: { value } } };
}

function makeMedicine(ts: string, name: string, unit: string, value: number) {
  return { type: 'medical' as const, timestamp: ts, medical: { type: 'medicine' as const, medicine: { name, unit, value } } };
}

describe('computeDailySummary', () => {
  describe('empty input', () => {
    it('returns hasAny: false with all nulls', () => {
      const result = computeDailySummary([], { now: DateTime.fromISO('2025-01-15T12:00:00') });
      expect(result.hasAny).toBe(false);
      expect(result.feed.bottle).toBeNull();
      expect(result.feed.latch).toBeNull();
      expect(result.feed.solids).toBeNull();
      expect(result.diapers).toBeNull();
      expect(result.medical).toBeNull();
    });
  });

  describe('only-yesterday input', () => {
    it('filters out past-day activities', () => {
      // Now is Jan 15 noon; yesterday is Jan 14
      const now = DateTime.fromISO('2025-01-15T12:00:00');
      vi.setSystemTime(now.toJSDate());

      const activities = [
        makeFeed('2025-01-14T08:00:00.000Z', 'latch', { duration: { left: { seconds: 600 }, right: { seconds: 300 } } }),
        makeDiaper('2025-01-14T09:00:00.000Z', 'wet'),
        makeTemp('2025-01-14T10:00:00.000Z', 37.0),
      ];

      const result = computeDailySummary(activities, { now });

      expect(result.hasAny).toBe(false);
      expect(result.feed.latch).toBeNull();
      expect(result.diapers).toBeNull();
      expect(result.medical).toBeNull();
    });
  });

  describe('mixed feeds today', () => {
    it('aggregates bottle, latch, and solids correctly', () => {
      const now = DateTime.fromISO('2025-01-15T12:00:00');
      vi.setSystemTime(now.toJSDate());

      const activities = [
        makeFeed('2025-01-15T07:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T10:00:00.000Z', 'formula', { volume: { ml: 90 } }),
        makeFeed('2025-01-15T11:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 180 } } }),
        makeFeed('2025-01-15T11:30:00.000Z', 'solids', { description: 'Rice' }),
        makeFeed('2025-01-15T11:45:00.000Z', 'solids', { description: 'rice' }), // duplicate, case-insensitive
        makeFeed('2025-01-15T11:50:00.000Z', 'solids', { description: 'Banana' }),
      ];

      const result = computeDailySummary(activities, { now });

      expect(result.hasAny).toBe(true);
      expect(result.feed.bottle).toEqual({
        totalMl: 210,
        count: 3,
        breakdown: [
          { subType: 'expressed', count: 2, ml: 120 },
          { subType: 'formula', count: 1, ml: 90 },
          { subType: 'water', count: 0, ml: 0 },
        ],
      });
      expect(result.feed.latch).toEqual({
        count: 1,
        avgLeftSeconds: 300,
        avgRightSeconds: 180,
      });
      expect(result.feed.solids).toEqual({
        count: 2, // Rice deduped (case-insensitive), Banana added
        descriptions: ['Rice', 'Banana'],
      });
    });
  });

  describe('diaper counts + last-wet-ago', () => {
    it('aggregates counts and computes agoMs for each type', () => {
      // Set `now` to the LAST MILLISECOND of Jan 15 UTC so that startOf('day') = Jan 15 00:00.
      // This ensures activities on Jan 15 UTC are in "today" even when `now` is late in the day.
      vi.setSystemTime(new Date('2026-01-15T23:59:59.999Z'));
      const now = DateTime.utc();

      // All on Jan 15 UTC — the same calendar day as now.startOf('day').
      const twelveHoursAgo = '2026-01-15T12:00:00.000Z';
      const eightHoursAgo = '2026-01-15T16:00:00.000Z';
      const sixHoursAgo = '2026-01-15T18:00:00.000Z';
      const twoHoursAgo = '2026-01-15T22:00:00.000Z';

      const activities = [
        makeDiaper(twelveHoursAgo, 'wet'),
        makeDiaper(eightHoursAgo, 'dirty'),
        makeDiaper(sixHoursAgo, 'mixed'),
        makeDiaper(twoHoursAgo, 'wet'),
      ];

      const result = computeDailySummary(activities, { now, zone: 'UTC' });

      expect(result.hasAny).toBe(true);
      expect(result.diapers).toEqual({
        wet: 2,
        dirty: 1,
        mixed: 1,
        total: 4,
        lastWetAgoMs: expect.any(Number),
        lastDirtyAgoMs: expect.any(Number),
        lastMixedAgoMs: expect.any(Number),
      });

      const lastWetAgo = result.diapers!.lastWetAgoMs!;
      expect(lastWetAgo).toBeGreaterThan(3_500_000);
      expect(lastWetAgo).toBeLessThan(14_400_000);
    });
  });

  describe('medical roll-up', () => {
    it('picks latest temperature and aggregates medicines', () => {
      // Set fake timer to noon Jan 15 UTC so startOf('day') = Jan 15 00:00.
      // All activities are on Jan 15 UTC — the same calendar day.
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
      const now = DateTime.utc();

      const oneAmJan15 = '2026-01-15T01:00:00.000Z';
      const fourAmJan15 = '2026-01-15T04:00:00.000Z';
      const sevenAmJan15 = '2026-01-15T07:00:00.000Z';
      const nineAmJan15 = '2026-01-15T09:00:00.000Z';
      const tenAmJan15 = '2026-01-15T10:00:00.000Z';

      const activities = [
        makeTemp(oneAmJan15, 37.2),
        makeTemp(fourAmJan15, 37.4),
        makeTemp(sevenAmJan15, 37.3),
        makeTemp(nineAmJan15, 37.5), // chronologically LAST after sort, also highest value
        makeMedicine(tenAmJan15, 'Paracetamol', 'ml', 5),
        makeMedicine(tenAmJan15, 'Paracetamol', 'ml', 5),
        makeMedicine(tenAmJan15, 'Ibuprofen', 'ml', 4),
      ];

      const result = computeDailySummary(activities, { now, zone: 'UTC' });

      expect(result.hasAny).toBe(true);
      expect(result.medical!.latestTemperature).toEqual({
        valueC: 37.5,
        agoMs: expect.any(Number),
      });
      expect(result.medical!.medicines).toHaveLength(2);

      const paracetamol = result.medical!.medicines.find((m) => m.name === 'Paracetamol')!;
      expect(paracetamol.count).toBe(2);
      expect(paracetamol.totalValue).toBe(10);
      expect(paracetamol.unit).toBe('ml');
      expect(paracetamol.mixedUnits).toBe(false);

      const ibuprofen = result.medical!.medicines.find((m) => m.name === 'Ibuprofen')!;
      expect(ibuprofen.count).toBe(1);
      expect(ibuprofen.totalValue).toBe(4);
      expect(ibuprofen.mixedUnits).toBe(false);
    });

    it('sets mixedUnits=true when same medicine name has different units', () => {
      vi.setSystemTime(new Date('2026-01-17T12:00:00.000Z'));
      const now = DateTime.utc();

      const first = '2026-01-17T06:00:00.000Z';
      const second = '2026-01-17T07:00:00.000Z';

      const activities = [
        makeMedicine(first, 'Paracetamol', 'ml', 5),
        makeMedicine(second, 'Paracetamol', 'mg', 250),
      ];

      const result = computeDailySummary(activities, { now, zone: 'UTC' });

      const paracetamol = result.medical!.medicines.find((m) => m.name === 'Paracetamol')!;
      expect(paracetamol.count).toBe(2);
      expect(paracetamol.totalValue).toBe(5);
      expect(paracetamol.mixedUnits).toBe(true);
    });
  });

  describe('timezone edge case', () => {
    it('treats 23:30 UTC as next local day in UTC+8', () => {
      const now = DateTime.fromISO('2025-01-15T12:00:00', { zone: 'Asia/Singapore' });
      vi.setSystemTime(now.toJSDate());

      // 23:30 UTC Jan 14 = 07:30 SGT Jan 15 (next local day)
      const activities = [
        makeFeed('2025-01-14T23:30:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
      ];

      const result = computeDailySummary(activities, { now, zone: 'Asia/Singapore' });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch).toEqual({ count: 1, avgLeftSeconds: 300, avgRightSeconds: 200 });
    });

    it('treats 00:30 UTC as previous local day in UTC+8', () => {
      // Now 08:30 SGT Jan 15 (00:30 UTC)
      const now = DateTime.fromISO('2025-01-15T08:30:00', { zone: 'Asia/Singapore' });
      vi.setSystemTime(now.toJSDate());

      // 00:30 UTC Jan 15 = 08:30 SGT Jan 15 (still today in SGT)
      const activities = [
        makeFeed('2025-01-15T00:30:00.000Z', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
      ];

      const result = computeDailySummary(activities, { now, zone: 'Asia/Singapore' });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch).toEqual({ count: 1, avgLeftSeconds: 100, avgRightSeconds: 100 });
    });
  });

  describe('robustness', () => {
    it('skips null and activities with missing timestamps', () => {
      const now = DateTime.fromISO('2025-01-15T12:00:00');
      vi.setSystemTime(now.toJSDate());

      const activities: unknown[] = [
        { type: 'feed' }, // completely malformed — missing timestamp, filtered out
        null,
        { type: 'diaper_change', timestamp: 'invalid-ts' }, // unparseable timestamp
        { type: 'feed', timestamp: '2025-01-15T08:00:00.000Z', feed: { type: 'water' } }, // valid timestamp, water feed = bottle total 0, count 1
      ];

      const result = computeDailySummary(activities as readonly unknown[], { now });
      // Should not throw — all skipped gracefully
      expect(result.feed.bottle).toEqual({
        totalMl: 0,
        count: 1,
        breakdown: [{ subType: 'expressed', count: 0, ml: 0 }, { subType: 'formula', count: 0, ml: 0 }, { subType: 'water', count: 1, ml: 0 }],
      });
    });

    it('skips unparseable timestamps', () => {
      const now = DateTime.fromISO('2025-01-15T12:00:00');
      vi.setSystemTime(now.toJSDate());

      const activities = [
        makeFeed('not-a-timestamp', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'latch', { duration: { left: { seconds: 200 }, right: { seconds: 200 } } }),
      ];

      const result = computeDailySummary(activities, { now });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch!.count).toBe(1);
      expect(result.feed.latch!.avgLeftSeconds).toBe(200);
    });
  });

  describe('hasAny', () => {
    it('is true when any activity type has data', () => {
      const now = DateTime.fromISO('2025-01-15T12:00:00.000Z', { zone: 'UTC' });
      vi.setSystemTime(now.toJSDate());

      const feedOnly = [
        makeFeed('2025-01-15T08:00:00.000Z', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
      ];
      expect(computeDailySummary(feedOnly, { now, zone: 'UTC' }).hasAny).toBe(true);

      const diaperOnly = [makeDiaper('2025-01-15T08:00:00.000Z', 'wet')];
      expect(computeDailySummary(diaperOnly, { now, zone: 'UTC' }).hasAny).toBe(true);

      const tempOnly = [makeTemp('2025-01-15T08:00:00.000Z', 37.0)];
      expect(computeDailySummary(tempOnly, { now, zone: 'UTC' }).hasAny).toBe(true);
    });
  });
});