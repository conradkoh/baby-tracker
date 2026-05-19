import type { Activity } from '../../activity/Activity';
import type { BottleFeedType } from '../../activity/Activity';

export interface Last24hSummary {
  hasAny: boolean;
  feed: {
    lastFeedAtMs: number | null;
    last3hMl: number;
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
  let last3hMl = 0;
  let bottleCount = 0;
  let wet = 0;
  let dirty = 0;
  let mixed = 0;
  let hasAny = false;
  const threeHourBoundaryMs = nowMs - 3 * 60 * 60 * 1000;

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
          if (tsMs > threeHourBoundaryMs) {
            last3hMl += vol;
          }
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

  return {
    hasAny,
    feed: {
      lastFeedAtMs,
      last3hMl,
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