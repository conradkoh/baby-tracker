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
    it('returns hasAny: false with all zeros and null lastFeedAtMs', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const result = computeLast24hSummary([], Date.now());
      expect(result.hasAny).toBe(false);
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
      expect(result.hasAny).toBe(true);
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
      expect(result.hasAny).toBe(true);
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
    it('are ignored (hasAny stays false if only medical)', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [makeTemp('2025-01-15T08:00:00.000Z', 37.5)];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.hasAny).toBe(false);
    });

    it('hasAny is true when medical + feed present', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeTemp('2025-01-15T08:00:00.000Z', 37.5),
        makeFeed('2025-01-15T09:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
      ];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.hasAny).toBe(true);
    });
  });
});