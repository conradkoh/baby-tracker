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
      expect(result.feed.threeHourAvgMl).toBe(0);
      expect(result.feed.total24hMl).toBe(0);
      expect(result.feed.bottleCount).toBe(0);
      expect(result.diapers.wet).toBe(0);
      expect(result.diapers.dirty).toBe(0);
      expect(result.diapers.mixed).toBe(0);
      expect(result.diapers.total).toBe(0);
    });
  });

  describe('single feed inside window', () => {
    it('sets lastFeedAtMs, threeHourAvgMl is 0 (need >= 2)', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const ts = '2025-01-15T08:00:00.000Z';
      const activities = [makeFeed(ts, 'expressed', { volume: { ml: 60 } })];
      const result = computeLast24hSummary(activities, Date.now());
      expect(result.hasAny).toBe(true);
      expect(result.feed.lastFeedAtMs).toBe(Date.parse(ts));
      expect(result.feed.threeHourAvgMl).toBe(0);
      expect(result.feed.total24hMl).toBe(60);
      expect(result.feed.bottleCount).toBe(1);
    });
  });

  describe('2+ bottle feeds → extrapolation formula', () => {
    it('matches old computeSummaryStats extrapolation', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const now = Date.now();
      const t1 = '2025-01-15T06:00:00.000Z'; // 6h ago, 80ml
      const t2 = '2025-01-15T08:00:00.000Z'; // 4h ago, 90ml
      const t3 = '2025-01-15T10:00:00.000Z'; // 2h ago, 70ml
      const activities = [
        makeFeed(t1, 'expressed', { volume: { ml: 80 } }),
        makeFeed(t2, 'formula', { volume: { ml: 90 } }),
        makeFeed(t3, 'expressed', { volume: { ml: 70 } }),
      ];
      const result = computeLast24hSummary(activities, now);

      expect(result.hasAny).toBe(true);
      expect(result.feed.bottleCount).toBe(3);
      expect(result.feed.total24hMl).toBe(240);

      const latest = { dateMs: Date.parse(t3), volumeMl: 70 };
      const earliest = { dateMs: Date.parse(t1), volumeMl: 80 };
      const totalVol = 240;
      const totalDurationMins = (latest.dateMs - earliest.dateMs) / (60 * 1000);
      const minutelyVolume = (totalVol - latest.volumeMl) / totalDurationMins;
      const expected3h = Math.ceil(minutelyVolume * 60 * 3);
      expect(result.feed.threeHourAvgMl).toBe(expected3h);
    });

    it('returns 0 for threeHourAvgMl when only 1 bottle feed', () => {
      vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
      const activities = [
        makeFeed('2025-01-15T08:00:00.000Z', 'expressed', { volume: { ml: 60 } }),
        makeFeed('2025-01-15T08:00:00.000Z', 'latch', { duration: { left: { seconds: 300 }, right: { seconds: 200 } } }),
      ];
      expect(computeLast24hSummary(activities, Date.now()).feed.threeHourAvgMl).toBe(0);
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
      expect(result.feed.threeHourAvgMl).toBeGreaterThan(0);
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