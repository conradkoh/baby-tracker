import type { Activity } from '../../activity/Activity';
import type { BottleFeedType } from '../../activity/Activity';

export interface Last24hSummary {
  hasAny: boolean;
  feed: {
    lastFeedAtMs: number | null;
    threeHourAvgMl: number;
    total24hMl: number;
    bottleCount: number;
  };
  diapers: {
    wet: number;
    dirty: number;
    mixed: number;
    total: number;
  };
}

const BOTTLE_TYPES: BottleFeedType[] = ['expressed', 'formula', 'water'];

export function computeLast24hSummary(
  activities: ReadonlyArray<Activity>,
  nowMs: number
): Last24hSummary {
  const windowStartMs = nowMs - 24 * 60 * 60 * 1000;

  let lastFeedAtMs: number | null = null;
  let total24hMl = 0;
  let bottleCount = 0;
  let wet = 0;
  let dirty = 0;
  let mixed = 0;
  let hasAny = false;

  for (const activity of activities) {
    const tsMs = Date.parse(activity.timestamp);
    if (tsMs <= nowMs && tsMs > windowStartMs) {
      if (activity.type === 'feed') {
        hasAny = true;
        if (tsMs > (lastFeedAtMs ?? 0)) {
          lastFeedAtMs = tsMs;
        }

        const feedType = activity.feed.type;
        if (BOTTLE_TYPES.includes(feedType as BottleFeedType)) {
          const vol = (activity.feed as { type: BottleFeedType; volume: { ml: number } }).volume.ml;
          total24hMl += vol;
          bottleCount++;
        }
      } else if (activity.type === 'diaper_change') {
        hasAny = true;
        const diaperType = activity.diaperChange.type;
        if (diaperType === 'wet') wet++;
        else if (diaperType === 'dirty') dirty++;
        else if (diaperType === 'mixed') mixed++;
      }
    }
  }

  let threeHourAvgMl = 0;
  if (bottleCount >= 2) {
    const bottleFeedsInWindow: { dateMs: number; volumeMl: number }[] = [];
    for (const activity of activities) {
      const tsMs = Date.parse(activity.timestamp);
      if (tsMs <= nowMs && tsMs > windowStartMs && activity.type === 'feed') {
        const feedType = activity.feed.type;
        if (BOTTLE_TYPES.includes(feedType as BottleFeedType)) {
          bottleFeedsInWindow.push({
            dateMs: tsMs,
            volumeMl: (activity.feed as { type: BottleFeedType; volume: { ml: number } }).volume.ml,
          });
        }
      }
    }

    if (bottleFeedsInWindow.length >= 2) {
      bottleFeedsInWindow.sort((a, b) => b.dateMs - a.dateMs);
      const latest = bottleFeedsInWindow[0];
      const earliest = bottleFeedsInWindow[bottleFeedsInWindow.length - 1];
      const totalVol = bottleFeedsInWindow.reduce((sum, f) => sum + f.volumeMl, 0);
      const totalDurationMins = (latest.dateMs - earliest.dateMs) / (60 * 1000);
      if (totalDurationMins > 0) {
        const minutelyVolume = (totalVol - latest.volumeMl) / totalDurationMins;
        threeHourAvgMl = Math.ceil(minutelyVolume * 60 * 3);
      }
    }
  }

  return {
    hasAny,
    feed: {
      lastFeedAtMs,
      threeHourAvgMl,
      total24hMl,
      bottleCount,
    },
    diapers: {
      wet,
      dirty,
      mixed,
      total: wet + dirty + mixed,
    },
  };
}