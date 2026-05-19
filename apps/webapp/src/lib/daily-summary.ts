/**
 * Pure computation module for daily activity summaries.
 *
 * Designed to work with the most recent N activities returned by the home-page
 * paginated query — it summarises whatever it receives without paginating further.
 * For a complete daily view, callers should ensure enough activities are loaded
 * to cover the current day (known limitation for v1).
 */

import { DateTime } from 'luxon';

// ── Input shape (mirrors domain Activity, safely typed with unknown) ──────────

type FeedSubType = 'latch' | 'expressed' | 'formula' | 'water' | 'solids';
type DiaperSubType = 'wet' | 'dirty' | 'mixed';
type MedicalSubType = 'temperature' | 'medicine';

interface FeedActivity {
  type: 'feed';
  timestamp: string;
  feed: {
    type: FeedSubType;
    duration?: { left?: { seconds?: number }; right?: { seconds?: number } };
    volume?: { ml?: number };
    description?: string;
  };
}

interface DiaperActivity {
  type: 'diaper_change';
  timestamp: string;
  diaperChange: { type: DiaperSubType };
}

interface MedicalActivity {
  type: 'medical';
  timestamp: string;
  medical: {
    type: MedicalSubType;
    temperature?: { value?: number };
    medicine?: { name?: string; unit?: string; value?: number };
  };
}

type Activity = FeedActivity | DiaperActivity | MedicalActivity;

// ── Output types ──────────────────────────────────────────────────────────────

export interface BottleBreakdown {
  subType: 'expressed' | 'formula' | 'water';
  count: number;
  ml: number;
}

export interface DailySummary {
  hasAny: boolean;
  feed: {
    bottle: {
      totalMl: number;
      count: number;
      breakdown: BottleBreakdown[];
    } | null;
    latch: {
      count: number;
      avgLeftSeconds: number;
      avgRightSeconds: number;
    } | null;
    solids: {
      count: number;
      descriptions: string[];
    } | null;
  };
  diapers: {
    wet: number;
    dirty: number;
    mixed: number;
    total: number;
    lastWetAgoMs: number | null;
    lastDirtyAgoMs: number | null;
    lastMixedAgoMs: number | null;
  } | null;
  medical: {
    latestTemperature: { valueC: number; agoMs: number } | null;
    medicines: Array<{
      name: string;
      unit: string;
      totalValue: number;
      count: number;
      mixedUnits: boolean;
    }>;
  } | null;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function isActivity(a: unknown): a is Activity {
  if (typeof a !== 'object' || a === null) return false;
  return typeof (a as Record<string, unknown>).type === 'string';
}

function parseActivity(a: unknown): Activity | null {
  if (!isActivity(a)) return null;
  return a as Activity;
}

/**
 * Compute a daily summary from a list of activities.
 *
 * Filters activities to the local calendar day of `options.now ?? DateTime.now()`
 * in `options.zone ?? 'local'`, then aggregates feed, diaper, and medical data.
 *
 * Note: depends on the caller loading enough activities to cover the full day
 * (the home-page query loads 20 most-recent by default — may not cover a full
 * busy day in v1).
 */
export function computeDailySummary(
  activities: readonly unknown[],
  options?: { now?: DateTime; zone?: string }
): DailySummary {
  const now = options?.now ?? DateTime.now();
  const zone = options?.zone ?? 'local';

  // Start-of-day for the local calendar day
  const dayStart = now.startOf('day');
  const dayEnd = now.endOf('day'); // inclusive end

  // Parse and filter to today
  const todaysActivities: Activity[] = [];
  for (const a of activities) {
    const act = parseActivity(a);
    if (!act) continue;
    const ts = act.timestamp;
    if (!ts) continue;
    const dt = DateTime.fromISO(ts, { zone });
    if (!dt.isValid) continue;
    // Inclusive of start-of-day, exclusive of next day (dt < dayEnd+1ms covers end-of-day)
    if (dt < dayStart || dt > dayEnd) continue;
    todaysActivities.push(act);
  }

  // No explicit sort — aggregation uses string comparison (>) for latest entries,
  // which handles ISO strings deterministically.
  todaysActivities.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Aggregate feed
  let bottleTotalMl = 0;
  let bottleCount = 0;
  const bottleBreakdown: Record<string, { count: number; ml: number }> = {
    expressed: { count: 0, ml: 0 },
    formula: { count: 0, ml: 0 },
    water: { count: 0, ml: 0 },
  };
  let latchCount = 0;
  let latchLeftTotal = 0;
  let latchRightTotal = 0;
  const solidsDescriptions: string[] = [];
  const seenSolids = new Set<string>();

  // Aggregate diapers
  let wetCount = 0;
  let dirtyCount = 0;
  let mixedCount = 0;
  let lastWetTs: string | null = null;
  let lastDirtyTs: string | null = null;
  let lastMixedTs: string | null = null;

  // Aggregate medical
  let latestTempValue: number | null = null;
  let latestTempTs: string | null = null;
  const medicineMap = new Map<
    string,
    { name: string; unit: string; totalValue: number; count: number; mixedUnits: boolean }
  >();

  for (const act of todaysActivities) {
    switch (act.type) {
      case 'feed': {
        const ft = (act.feed?.type as string) ?? 'latch';
        if (ft === 'expressed' || ft === 'formula' || ft === 'water') {
          const ml = (act.feed.volume?.ml as number) ?? 0;
          bottleTotalMl += ml;
          bottleCount++;
          bottleBreakdown[ft].count++;
          bottleBreakdown[ft].ml += ml;
        } else if (ft === 'latch') {
          latchCount++;
          latchLeftTotal += (act.feed.duration?.left?.seconds as number) ?? 0;
          latchRightTotal += (act.feed.duration?.right?.seconds as number) ?? 0;
        } else if (ft === 'solids') {
          const desc = (act.feed.description as string) ?? '';
          if (desc && !seenSolids.has(desc.toLowerCase())) {
            seenSolids.add(desc.toLowerCase());
            solidsDescriptions.push(desc);
          }
        }
        break;
      }
      case 'diaper_change': {
        const rawType = act.diaperChange?.type as string | undefined;
        if (rawType !== 'wet' && rawType !== 'dirty' && rawType !== 'mixed') break;
        if (rawType === 'wet') {
          wetCount++;
          lastWetTs = act.timestamp;
        } else if (rawType === 'dirty') {
          dirtyCount++;
          lastDirtyTs = act.timestamp;
        } else if (rawType === 'mixed') {
          mixedCount++;
          lastMixedTs = act.timestamp;
        }
        break;
      }
      case 'medical': {
        const rawType = act.medical?.type as string | undefined;
        if (rawType !== 'temperature' && rawType !== 'medicine') break;
        if (rawType === 'temperature') {
          const val = act.medical.temperature?.value as number | undefined;
          if (val !== undefined && (!latestTempTs || act.timestamp > latestTempTs)) {
            latestTempValue = val;
            latestTempTs = act.timestamp;
          }
        } else if (rawType === 'medicine') {
          const med = act.medical.medicine;
          const name = (med?.name as string) ?? '';
          const unit = (med?.unit as string) ?? '';
          const value = (med?.value as number | undefined) ?? 0;
          if (!name) break;
          const key = name.toLowerCase();
          const existing = medicineMap.get(key);
          if (!existing) {
            medicineMap.set(key, { name, unit, totalValue: value ?? 0, count: 1, mixedUnits: false });
          } else {
            existing.count++;
            if (unit !== existing.unit) {
              existing.mixedUnits = true;
              // Do NOT sum value when units differ
            } else if (value !== undefined) {
              existing.totalValue += value;
            }
          }
        }
        break;
      }
    }
  }

  // Build output
  const bottleBlock =
    bottleCount > 0
      ? {
          totalMl: bottleTotalMl,
          count: bottleCount,
          breakdown: (['expressed', 'formula', 'water'] as const).map((st) => ({
            subType: st,
            count: bottleBreakdown[st].count,
            ml: bottleBreakdown[st].ml,
          })),
        }
      : null;

  const latchBlock =
    latchCount > 0
      ? {
          count: latchCount,
          avgLeftSeconds: Math.round(latchLeftTotal / latchCount),
          avgRightSeconds: Math.round(latchRightTotal / latchCount),
        }
      : null;

  const solidsBlock =
    solidsDescriptions.length > 0
      ? { count: solidsDescriptions.length, descriptions: solidsDescriptions }
      : null;

  const diaperBlock =
    wetCount + dirtyCount + mixedCount > 0
      ? {
          wet: wetCount,
          dirty: dirtyCount,
          mixed: mixedCount,
          total: wetCount + dirtyCount + mixedCount,
          lastWetAgoMs: lastWetTs ? now.toMillis() - DateTime.fromISO(lastWetTs, { zone }).toMillis() : null,
          lastDirtyAgoMs: lastDirtyTs
            ? now.toMillis() - DateTime.fromISO(lastDirtyTs, { zone }).toMillis()
            : null,
          lastMixedAgoMs: lastMixedTs
            ? now.toMillis() - DateTime.fromISO(lastMixedTs, { zone }).toMillis()
            : null,
        }
      : null;

  const latestTemp =
    latestTempValue !== null && latestTempTs !== null
      ? {
          valueC: latestTempValue,
          agoMs: now.toMillis() - DateTime.fromISO(latestTempTs, { zone }).toMillis(),
        }
      : null;

  const medicines = Array.from(medicineMap.values());

  const medicalBlock =
    latestTemp !== null || medicines.length > 0 ? { latestTemperature: latestTemp, medicines } : null;

  const hasAny = bottleBlock !== null || latchBlock !== null || solidsBlock !== null || diaperBlock !== null || medicalBlock !== null;

  return {
    hasAny,
    feed: {
      bottle: bottleBlock,
      latch: latchBlock,
      solids: solidsBlock,
    },
    diapers: diaperBlock,
    medical: medicalBlock,
  };
}