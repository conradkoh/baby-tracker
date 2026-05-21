import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DateTime } from 'luxon';
import { computeDailySummary, computeDailySummariesByDay, computeLast24hSummary, type Activity } from './daily-summary';

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Returns a day range for a given ISO timestamp in the specified zone.
 * The timestamp is used only to identify the calendar day; start-of-day and
 * end-of-day are computed in the given zone.
 */
function dayRange(iso: string, zone = 'local') {
  const d = DateTime.fromISO(iso, { zone });
  return { dayStart: d.startOf('day'), dayEnd: d.endOf('day'), zone };
}

function referenceTime(iso: string, zone = 'local') {
  return DateTime.fromISO(iso, { zone });
}

// ── Activity factories ───────────────────────────────────────────────────────

function makeFeed(ts: string, subType: string, extras: Record<string, unknown> = {}) {
  return { type: 'feed' as const, timestamp: Date.parse(ts), feed: { type: subType, ...extras } };
}

function makeDiaper(ts: string, diaperType: string) {
  return { type: 'diaper_change' as const, timestamp: Date.parse(ts), diaperChange: { type: diaperType } };
}

function makeTemp(ts: string, value: number) {
  return { type: 'medical' as const, timestamp: Date.parse(ts), medical: { type: 'temperature' as const, temperature: { value } } };
}

function makeMedicine(ts: string, name: string, unit: string, value: number) {
  return { type: 'medical' as const, timestamp: Date.parse(ts), medical: { type: 'medicine' as const, medicine: { name, unit, value } } };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('computeDailySummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty input', () => {
    it('returns hasAny: false with all nulls', () => {
      const range = dayRange('2025-01-15T12:00:00');
      const ref = referenceTime('2025-01-15T12:00:00');
      const result = computeDailySummary([], { ...range, referenceTime: ref });
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
      // Range is Jan 15; all activities are Jan 14
      const range = dayRange('2025-01-15T12:00:00');
      const ref = referenceTime('2025-01-15T12:00:00');

      const activities = [
        makeFeed('2025-01-14T08:00:00.000Z', 'latch', { duration: { left: { seconds: 600 }, right: { seconds: 300 } } }),
        makeDiaper('2025-01-14T09:00:00.000Z', 'wet'),
        makeTemp('2025-01-14T10:00:00.000Z', 37.0),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });

      expect(result.hasAny).toBe(false);
      expect(result.feed.latch).toBeNull();
      expect(result.diapers).toBeNull();
      expect(result.medical).toBeNull();
    });
  });

  describe('mixed feeds today', () => {
    it('aggregates bottle, latch, and solids correctly', () => {
      const range = dayRange('2025-01-15T12:00:00');
      const ref = referenceTime('2025-01-15T12:00:00');

      const activities = [
        makeFeed('2025-01-15T07:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T10:00:00.000Z', 'formula', { volume: { ml: 90 } }),
        makeFeed('2025-01-15T11:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 180 } } }),
        makeFeed('2025-01-15T11:30:00.000Z', 'solids', { description: 'Rice' }),
        makeFeed('2025-01-15T11:45:00.000Z', 'solids', { description: 'rice' }), // duplicate, case-insensitive
        makeFeed('2025-01-15T11:50:00.000Z', 'solids', { description: 'Banana' }),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });

      expect(result.hasAny).toBe(true);
      expect(result.feed.bottle).toEqual({ totalMl: 210, count: 3 });
      expect(result.feed.latch).toEqual({ totalSeconds: 480 });
      expect(result.feed.solids).toEqual({ count: 3 });
    });
  });

  describe('diaper counts + last-wet-ago', () => {
    it('aggregates counts and computes agoMs for each type', () => {
      // Set system time to 23:59:59 Jan 15 UTC so that dayStart = Jan 15 00:00.
      vi.setSystemTime(new Date('2026-01-15T23:59:59.999Z'));
      const range = dayRange('2026-01-15T12:00:00', 'UTC');
      const ref = DateTime.utc();

      // All activities on Jan 15 UTC
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

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });

      expect(result.hasAny).toBe(true);
      expect(result.diapers).toEqual({
        wet: 2,
        dirty: 1,
        mixed: 1,
        total: 4,
        lastWetAgoMs: expect.any(Number),
        lastDirtyAgoMs: expect.any(Number),
        lastMixedAgoMs: expect.any(Number),
        lastWetAt: Date.parse(twoHoursAgo),
        lastDirtyAt: Date.parse(eightHoursAgo),
        lastMixedAt: Date.parse(sixHoursAgo),
      });

      const lastWetAgo = result.diapers!.lastWetAgoMs!;
      expect(lastWetAgo).toBeGreaterThan(3_500_000);
      expect(lastWetAgo).toBeLessThan(14_400_000);
    });
  });

  describe('medical roll-up', () => {
    it('picks latest temperature and aggregates medicines', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
      const range = dayRange('2026-01-15T12:00:00', 'UTC');
      const ref = DateTime.utc();

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

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });

      expect(result.hasAny).toBe(false);
      expect(result.medical).not.toBeNull();
      expect(result.medical!.latestTemperature).toEqual({
        valueC: 37.5,
        agoMs: expect.any(Number),
        at: Date.parse(nineAmJan15),
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
      const range = dayRange('2026-01-17T12:00:00', 'UTC');
      const ref = DateTime.utc();

      const first = '2026-01-17T06:00:00.000Z';
      const second = '2026-01-17T07:00:00.000Z';

      const activities = [
        makeMedicine(first, 'Paracetamol', 'ml', 5),
        makeMedicine(second, 'Paracetamol', 'mg', 250),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });

      const paracetamol = result.medical!.medicines.find((m) => m.name === 'Paracetamol')!;
      expect(paracetamol.count).toBe(2);
      expect(paracetamol.totalValue).toBe(5);
      expect(paracetamol.mixedUnits).toBe(true);
    });
  });

  describe('timezone edge case', () => {
    it('treats 23:30 UTC as next local day in UTC+8', () => {
      vi.setSystemTime(new Date('2025-01-15T00:00:00Z'));
      const range = dayRange('2025-01-15T00:00:00', 'Asia/Singapore');
      const ref = DateTime.fromISO('2025-01-15T00:00:00', { zone: 'Asia/Singapore' });

      // 23:30 UTC Jan 14 = 07:30 SGT Jan 15 (next local day)
      const activities = [
        makeFeed('2025-01-14T23:30:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch).toEqual({ totalSeconds: 500 });
    });

    it('treats 00:30 UTC as previous local day in UTC+8', () => {
      vi.setSystemTime(new Date('2025-01-15T00:30:00Z'));
      const range = dayRange('2025-01-15T00:30:00', 'Asia/Singapore');
      const ref = DateTime.fromISO('2025-01-15T00:30:00', { zone: 'Asia/Singapore' });

      // 00:30 UTC Jan 15 = 08:30 SGT Jan 15 (still today in SGT)
      const activities = [
        makeFeed('2025-01-15T00:30:00.000Z', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch).toEqual({ totalSeconds: 200 });
    });
  });

  describe('robustness', () => {
    it('skips null and activities with missing timestamps', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
      const range = dayRange('2025-01-15T12:00:00', 'UTC');
      const ref = DateTime.utc();

      const activities: unknown[] = [
        { type: 'feed' }, // completely malformed — missing timestamp, filtered out
        null,
        { type: 'diaper_change', timestamp: NaN }, // unparseable timestamp (NaN)
        { type: 'feed', timestamp: Date.parse('2025-01-15T08:00:00.000Z'), feed: { type: 'water' } }, // valid, water feed = bottle total 0, count 1
      ];

      const result = computeDailySummary(activities as readonly unknown[], { ...range, referenceTime: ref });
      // Should not throw — all skipped gracefully
      expect(result.feed.bottle).toEqual({ totalMl: 0, count: 1 });
    });

    it('skips unparseable timestamps', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
      const range = dayRange('2025-01-15T12:00:00', 'UTC');
      const ref = DateTime.utc();

      const activities = [
        makeFeed('not-a-timestamp', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'latch', { duration: { left: { seconds: 200 }, right: { seconds: 200 } } }),
      ];

      const result = computeDailySummary(activities, { ...range, referenceTime: ref });
      expect(result.hasAny).toBe(true);
      expect(result.feed.latch!.totalSeconds).toBe(400);
    });
  });

  describe('hasAny', () => {
    it('is true when any activity type has data', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const range = dayRange('2025-01-15T12:00:00', 'UTC');
      const ref = DateTime.utc();

      const feedOnly = [
        makeFeed('2025-01-15T08:00:00.000Z', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
      ];
      expect(computeDailySummary(feedOnly, { ...range, referenceTime: ref }).hasAny).toBe(true);

      const diaperOnly = [makeDiaper('2025-01-15T08:00:00.000Z', 'wet')];
      expect(computeDailySummary(diaperOnly, { ...range, referenceTime: ref }).hasAny).toBe(true);

      const tempOnly = [makeTemp('2025-01-15T08:00:00.000Z', 37.0)];
      expect(computeDailySummary(tempOnly, { ...range, referenceTime: ref }).hasAny).toBe(false);
    });
  });
});

describe('computeDailySummariesByDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array for empty input', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();
    const result = computeDailySummariesByDay([], { zone: 'UTC', referenceTime: ref });
    expect(result).toEqual([]);
  });

  it('two days of activities → two entries, newest first', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();

    const jan14 = '2025-01-14T08:00:00.000Z';
    const jan15 = '2025-01-15T10:00:00.000Z';

    const activities = [
      makeFeed(jan14, 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
      makeFeed(jan15, 'expressed', { volume: { ml: 120 } }),
    ];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });

    expect(result).toHaveLength(2);
    expect(result[0].dateKey).toBe('2025-01-15');
    expect(result[0].summary.feed.bottle?.totalMl).toBe(120);
    expect(result[1].dateKey).toBe('2025-01-14');
    expect(result[1].summary.feed.latch).not.toBeNull();
  });

  it('all activities on one day → one entry', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();

    const activities = [
      makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
      makeFeed('2025-01-15T10:00:00.000Z', 'formula', { volume: { ml: 90 } }),
      makeFeed('2025-01-15T12:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
    ];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });

    expect(result).toHaveLength(1);
    expect(result[0].dateKey).toBe('2025-01-15');
    expect(result[0].summary.feed.bottle?.totalMl).toBe(150);
    expect(result[0].summary.feed.latch?.totalSeconds).toBe(500);
  });

  it('skips days where hasAny is false', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();

    // Only Jan 15 has valid feed; Jan 14 activities are filtered to a different day range
    const jan15 = '2025-01-15T10:00:00.000Z';
    const activities = [makeFeed(jan15, 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } })];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });
    expect(result).toHaveLength(1);
    expect(result[0].dateKey).toBe('2025-01-15');
  });

  it('sorts newest day first (ISO descending)', () => {
    vi.setSystemTime(new Date('2025-01-16T12:00:00.000Z'));
    const ref = DateTime.utc();

    const jan14 = '2025-01-14T08:00:00.000Z';
    const jan15 = '2025-01-15T08:00:00.000Z';
    const jan16 = '2025-01-16T08:00:00.000Z';

    // Pass in reverse order — should still come out newest-first
    const activities = [
      makeFeed(jan14, 'latch', { duration: { left: { seconds: 14 }, right: { seconds: 14 } } }),
      makeFeed(jan16, 'latch', { duration: { left: { seconds: 16 }, right: { seconds: 16 } } }),
      makeFeed(jan15, 'latch', { duration: { left: { seconds: 15 }, right: { seconds: 15 } } }),
    ];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });

    expect(result.map((e) => e.dateKey)).toEqual(['2025-01-16', '2025-01-15', '2025-01-14']);
  });

  it('dayStart in entry matches the start of the calendar day in the resolved zone', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();

    const jan15 = '2025-01-15T10:00:00.000Z';
    const activities = [makeFeed(jan15, 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } })];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });

    expect(result).toHaveLength(1);
    expect(result[0].dayStart.toISO()).toBe('2025-01-15T00:00:00.000Z');
  });

  it('latestTemperature.at is an epoch ms number when day has non-medical activity', () => {
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    const ref = DateTime.utc();

    const activities = [
      makeTemp('2025-01-15T10:00:00.000Z', 37.5),
      makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
    ];

    const result = computeDailySummariesByDay(activities, { zone: 'UTC', referenceTime: ref });

    expect(result).toHaveLength(1);
    expect(result[0].summary.hasAny).toBe(true);
    expect(result[0].summary.medical?.latestTemperature?.at).toBe(Date.parse('2025-01-15T10:00:00.000Z'));
  });
});

describe('computeLast24hSummary', () => {
  it('returns zeros when no activities in window', () => {
    const nowMs = Date.parse('2025-01-15T12:00:00.000Z');
    const result = computeLast24hSummary([], nowMs);
    expect(result.feed.lastFeedAtMs).toBeNull();
    expect(result.feed.last3hMl).toBe(0);
    expect(result.feed.total24hMl).toBe(0);
    expect(result.feed.bottleCount).toBe(0);
    expect(result.feed.last3hLatchSeconds).toBe(0);
    expect(result.feed.total24hLatchSeconds).toBe(0);
    expect(result.feed.latchCount).toBe(0);
    expect(result.diapers).toEqual({ wet: 0, dirty: 0, mixed: 0, total: 0 });
  });

  it('counts bottle feeds correctly within the 24h window', () => {
    const nowMs = Date.parse('2025-01-15T12:00:00.000Z');
    const activities = [
      makeFeed('2025-01-14T13:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
      makeFeed('2025-01-15T08:00:00.000Z', 'formula', { volume: { ml: 90 } }),
      makeFeed('2025-01-15T11:30:00.000Z', 'water', { volume: { ml: 30 } }),
    ] as Activity[];
    const result = computeLast24hSummary(activities, nowMs);
    expect(result.feed.bottleCount).toBe(3);
    expect(result.feed.total24hMl).toBe(180);
    expect(result.feed.last3hMl).toBe(30);
    expect(result.feed.last3hLatchSeconds).toBe(0);
    expect(result.feed.total24hLatchSeconds).toBe(0);
    expect(result.feed.latchCount).toBe(0);
  });

  it('aggregates latch duration over 3h and 24h windows', () => {
    const nowMs = Date.parse('2025-01-15T12:00:00.000Z');
    const activities = [
      // 1h ago → 3h window
      makeFeed('2025-01-15T11:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
      // 6h ago → 24h window but outside 3h
      makeFeed('2025-01-15T06:00:00.000Z', 'latch', { duration: { left: { seconds: 600 }, right: { seconds: 0 } } }),
      // 30h ago → outside 24h window
      makeFeed('2025-01-14T06:00:00.000Z', 'latch', { duration: { left: { seconds: 100 }, right: { seconds: 100 } } }),
    ] as Activity[];
    const result = computeLast24hSummary(activities, nowMs);
    expect(result.feed.last3hLatchSeconds).toBe(500);
    expect(result.feed.total24hLatchSeconds).toBe(1100);
    expect(result.feed.latchCount).toBe(2);
  });

  it('bottle feeds do not contribute to latch totals', () => {
    const nowMs = Date.parse('2025-01-15T12:00:00.000Z');
    const activities = [
      makeFeed('2025-01-15T11:00:00.000Z', 'expressed', { volume: { ml: 90 } }),
      makeFeed('2025-01-15T10:00:00.000Z', 'formula', { volume: { ml: 60 } }),
    ] as Activity[];
    const result = computeLast24hSummary(activities, nowMs);
    expect(result.feed.last3hLatchSeconds).toBe(0);
    expect(result.feed.total24hLatchSeconds).toBe(0);
    expect(result.feed.latchCount).toBe(0);
    expect(result.feed.last3hMl).toBe(150);
  });

  it('excludes activities older than 24h', () => {
    const nowMs = Date.parse('2025-01-15T12:00:00.000Z');
    const activities = [
      makeFeed('2025-01-13T12:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
      makeDiaper('2025-01-13T12:00:00.000Z', 'wet'),
      makeFeed('2025-01-15T10:00:00.000Z', 'expressed', { volume: { ml: 120 } }),
    ] as Activity[];
    const result = computeLast24hSummary(activities, nowMs);
    expect(result.feed.bottleCount).toBe(1);
    expect(result.feed.total24hMl).toBe(120);
    expect(result.feed.last3hLatchSeconds).toBe(0);
    expect(result.feed.total24hLatchSeconds).toBe(0);
    expect(result.feed.latchCount).toBe(0);
    expect(result.diapers).toEqual({ wet: 0, dirty: 0, mixed: 0, total: 0 });
  });
});

