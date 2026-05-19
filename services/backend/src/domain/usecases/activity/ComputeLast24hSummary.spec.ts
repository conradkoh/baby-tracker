import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeLast24hSummary, type Last24hSummary } from './ComputeLast24hSummary';

function makeFeed(ts: string, subType: string, extras: Record<string, unknown> = {}) {
  return { type: 'feed' as const, timestamp: ts, feed: { type: subType, ...extras } };
}

function makeDiaper(ts: string, diaperType: string) {
  return { type: 'diaper_change' as const, timestamp: ts, diaperChange: { type: diaperType } };
}

function makeTemp(ts: string, value: number) {
  return { type: 'medical' as const, timestamp: ts, medical: { type: 'temperature' as const, temperature: { value } } };
}

describe('computeLast24hSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty input', () => {
    it('returns all zeros and null lastFeedAtMs for empty input', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const result = computeLast24hSummary([], Date.now());
      expect(result.feed.lastFeedAtMs).toBeNull();
      expect(result.feed.last3hMl).toBe(0);
      expect(result.feed.total24hMl).toBe(0);
      expect(result.feed.bottleCount).toBe(0);
      expect(result.diapers.wet).toBe(0);
      expect(result.diapers.dirty).toBe(0);
      expect(result.diapers.mixed).toBe(0);
      expect(result.diapers.total).toBe(0);
    });
  });

  describe('single feed inside window', () => {
    it('sets lastFeedAtMs and total24hMl', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const ts = '2025-01-15T08:00:00.000Z';
      const activities = [makeFeed(ts, 'expressed', { volume: { ml: 60 } })];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.lastFeedAtMs).toBe(Date.parse(ts));
      expect(result.feed.last3hMl).toBe(0);  // 4h ago, outside 3h window
      expect(result.feed.total24hMl).toBe(60);
      expect(result.feed.bottleCount).toBe(1);
    });
  });

  describe('last3hMl — real sum of last 3 hours', () => {
    it('is 0 when no bottle feeds in last 3h', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T06:00:00.000Z', 'expressed', { volume: { ml: 80 } }), // 6h ago
        makeFeed('2025-01-15T08:00:00.000Z', 'formula', { volume: { ml: 90 } }),   // 4h ago
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.last3hMl).toBe(0);  // both outside 3h window
      expect(result.feed.total24hMl).toBe(170);
    });

    it('sums bottles inside 3h window and excludes those 3h-24h ago', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T06:00:00.000Z', 'expressed', { volume: { ml: 80 } }), // 6h ago
        makeFeed('2025-01-15T10:00:00.000Z', 'formula', { volume: { ml: 90 } }),   // 2h ago
        makeFeed('2025-01-15T11:00:00.000Z', 'expressed', { volume: { ml: 70 } }), // 1h ago
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.total24hMl).toBe(240);
      expect(result.feed.last3hMl).toBe(160);  // 90 + 70 (within 3h)
    });

    it('excludes breastfeed / solids from last3hMl', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T11:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
        makeFeed('2025-01-15T10:30:00.000Z', 'solids', { description: 'carrots' }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.last3hMl).toBe(0);
      expect(result.feed.total24hMl).toBe(0);
      expect(result.feed.bottleCount).toBe(0);
    });

    it('is exclusive on the 3h boundary (tsMs > nowMs - 3h)', () => {
      vi.useRealTimers();
      const now = new Date('2025-01-15T12:00:00.000Z').getTime();
      const justInside = new Date(now - 3 * 60 * 60 * 1000 + 1).toISOString();  // 2h 59m 59s ago
      const exactly3hAgo = new Date(now - 3 * 60 * 60 * 1000).toISOString();   // exactly 3h ago
      const justOutside = new Date(now - 3 * 60 * 60 * 1000 - 1).toISOString(); // 3h 1ms ago

      const activities = [
        makeFeed(justInside, 'expressed', { volume: { ml: 60 } }),
        makeFeed(exactly3hAgo, 'formula', { volume: { ml: 90 } }),
        makeFeed(justOutside, 'expressed', { volume: { ml: 30 } }),
      ];

      const result = computeLast24hSummary(activities, now);
      expect(result.feed.last3hMl).toBe(60);  // only justInside counts
      expect(result.feed.total24hMl).toBe(180);
    });
  });

  describe('activities outside window', () => {
    it('are excluded', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const inside = '2025-01-15T08:00:00.000Z';
      const outside = '2025-01-13T08:00:00.000Z';
      const activities = [
        makeFeed(inside, 'expressed', { volume: { ml: 60 } }),
        makeFeed(outside, 'formula', { volume: { ml: 90 } }),
        makeDiaper(outside, 'wet'),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(1);
      expect(result.feed.total24hMl).toBe(60);
      expect(result.diapers.total).toBe(0);
    });
  });

  describe('diaper counts', () => {
    it('counts wet, dirty, mixed correctly', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeDiaper('2025-01-15T06:00:00.000Z', 'wet'),
        makeDiaper('2025-01-15T07:00:00.000Z', 'dirty'),
        makeDiaper('2025-01-15T08:00:00.000Z', 'mixed'),
        makeDiaper('2025-01-15T09:00:00.000Z', 'wet'),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.diapers.wet).toBe(2);
      expect(result.diapers.dirty).toBe(1);
      expect(result.diapers.mixed).toBe(1);
      expect(result.diapers.total).toBe(4);
    });
  });

  describe('mixed feed types (latch + bottles)', () => {
    it('only bottles contribute to volume/count', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T06:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
        makeFeed('2025-01-15T07:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'formula', { volume: { ml: 90 } }),
        makeFeed('2025-01-15T09:00:00.000Z', 'water', { volume: { ml: 10 } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(3);
      expect(result.feed.total24hMl).toBe(160);
      expect(result.feed.last3hMl).toBe(0); // expressed/formula/water at 7-9h are outside 3h window
    });
  });

  describe('window boundaries', () => {
    it('excludes activity exactly 24h ago, includes most-recent', () => {
      vi.useRealTimers();
      const now = new Date('2025-01-15T12:00:00.000Z').getTime();
      const justInside = new Date(now - 1).toISOString();
      const exactly24hAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const justOutside = new Date(now - 24 * 60 * 60 * 1000 - 1).toISOString();

      const activities = [
        makeFeed(justInside, 'expressed', { volume: { ml: 60 } }),
        makeFeed(exactly24hAgo, 'formula', { volume: { ml: 90 } }),
        makeFeed(justOutside, 'expressed', { volume: { ml: 30 } }),
      ];

      const result = computeLast24hSummary(activities, now);
      expect(result.feed.bottleCount).toBe(1);
      expect(result.feed.total24hMl).toBe(60);
    });
  });

  describe('medical activities', () => {
    it('are ignored (all zeroes if only medical)', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [makeTemp('2025-01-15T08:00:00.000Z', 37.5)];
      const result = computeLast24hSummary(activities, Date.now());
    });

    it('produces feed volumes when medical + feed present', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeTemp('2025-01-15T08:00:00.000Z', 37.5),
        makeFeed('2025-01-15T09:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(1);
    });
  });

  describe('order independence', () => {
    it('produces same result regardless of input order', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activitiesSorted = [
        makeFeed('2025-01-15T10:00:00.000Z', 'expressed', { volume: { ml: 90 } }),
        makeFeed('2025-01-15T11:00:00.000Z', 'formula', { volume: { ml: 70 } }),
        makeDiaper('2025-01-15T10:00:00.000Z', 'wet'),
      ];
      const activitiesShuffled = [
        makeDiaper('2025-01-15T10:00:00.000Z', 'wet'),
        makeFeed('2025-01-15T11:00:00.000Z', 'formula', { volume: { ml: 70 } }),
        makeFeed('2025-01-15T10:00:00.000Z', 'expressed', { volume: { ml: 90 } }),
      ];
      const resultSorted = computeLast24hSummary(activitiesSorted, Date.now());
      const resultShuffled = computeLast24hSummary(activitiesShuffled, Date.now());
      expect(resultShuffled).toEqual(resultSorted);
    });
  });

  describe('duplicate timestamps', () => {
    it('counts both bottles at the same timestamp', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const ts = '2025-01-15T08:00:00.000Z';
      const activities = [
        makeFeed(ts, 'expressed', { volume: { ml: 60 } }),
        makeFeed(ts, 'formula', { volume: { ml: 90 } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(2);
      expect(result.feed.total24hMl).toBe(150);
      expect(result.feed.lastFeedAtMs).toBe(Date.parse(ts));
    });
  });

  describe('mixed feed types — lastFeedAtMs', () => {
    it('picks latest feed regardless of type (latch more recent than bottle)', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const breastTs = '2025-01-15T11:58:00.000Z';  // 2 min ago
      const bottleTs = '2025-01-15T11:55:00.000Z';   // 5 min ago
      const activities = [
        makeFeed(bottleTs, 'expressed', { volume: { ml: 60 } }),
        makeFeed(breastTs, 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.lastFeedAtMs).toBe(Date.parse(breastTs));
      expect(result.feed.bottleCount).toBe(1);
      expect(result.feed.total24hMl).toBe(60);
    });
  });

  describe('zero-volume bottle', () => {
    it('counts 0-ml bottle in bottleCount but contributes 0 to volumes', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 0 } }),
        makeFeed('2025-01-15T09:00:00.000Z', 'formula', { volume: { ml: 90 } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(2);
      expect(result.feed.total24hMl).toBe(90);
      expect(result.feed.last3hMl).toBe(0);
    });
  });

  describe('future-timestamped activity', () => {
    it('is excluded from all aggregates', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const futureTs = '2025-01-15T13:00:00.000Z';
      const activities = [
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed(futureTs, 'formula', { volume: { ml: 90 } }),
        makeDiaper(futureTs, 'wet'),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(1);
      expect(result.feed.total24hMl).toBe(60);
      expect(result.diapers.total).toBe(0);
    });
  });

  describe('composite input', () => {
    it('counts feed and diaper, ignores medical', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeDiaper('2025-01-15T09:00:00.000Z', 'wet'),
        makeTemp('2025-01-15T10:00:00.000Z', 37.5),
        makeDiaper('2025-01-15T11:00:00.000Z', 'dirty'),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.bottleCount).toBe(1);
      expect(result.feed.total24hMl).toBe(60);
      expect(result.diapers.wet).toBe(1);
      expect(result.diapers.dirty).toBe(1);
      expect(result.diapers.mixed).toBe(0);
      expect(result.diapers.total).toBe(2);
    });
  });

  describe('diapers only', () => {
    it('returns feed fields zeroed when only diapers present', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeDiaper('2025-01-15T08:00:00.000Z', 'wet'),
        makeDiaper('2025-01-15T09:00:00.000Z', 'mixed'),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.feed.lastFeedAtMs).toBeNull();
      expect(result.feed.last3hMl).toBe(0);
      expect(result.feed.total24hMl).toBe(0);
      expect(result.feed.bottleCount).toBe(0);
      expect(result.diapers.wet).toBe(1);
      expect(result.diapers.mixed).toBe(1);
      expect(result.diapers.total).toBe(2);
    });
  });
});