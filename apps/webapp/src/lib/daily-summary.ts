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

// ── Date-key helper (shared with callers) ─────────────────────────────────────

/**
 * Formats a DateTime or ISO timestamp string as `YYYY-MM-DD` in the local zone.
 * Used to derive `dateKey` for grouping activities by day.
 */
export function toDateKey(input: string | DateTime, zone: string = 'local'): string {
  const dt = typeof input === 'string' ? DateTime.fromISO(input, { zone }) : input.setZone(zone);
  return dt.toLocal().toFormat('yyyy-MM-dd');
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface DailySummary {
  hasAny: boolean;
  feed: {
    bottle: { totalMl: number; count: number } | null;
    latch: { totalSeconds: number } | null;
    solids: { count: number } | null;
  };
  diapers: {
    wet: number;
    dirty: number;
    mixed: number;
    total: number;
    lastWetAgoMs: number | null;
    lastDirtyAgoMs: number | null;
    lastMixedAgoMs: number | null;
    lastWetAt: string | null;
    lastDirtyAt: string | null;
    lastMixedAt: string | null;
  } | null;
  /**
   * Medical aggregation is computed but NOT rendered by DailySummaryCard
   * (intentional — re-enabling the UI is a render-only change).
   */
  medical: {
    latestTemperature: { valueC: number; agoMs: number; at: string } | null;
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
 * Compute a daily summary from a list of activities filtered to the given day range.
 *
 * @param activities - flat list of activities (any day)
 * @param options.dayStart - start of the calendar day (inclusive), in the resolved zone
 * @param options.dayEnd - end of the calendar day (inclusive), in the resolved zone
 * @param options.zone - timezone for parsing timestamps; defaults to 'local'
 * @param options.referenceTime - moment used for "agoMs" calculations; defaults to DateTime.now()
 */
export function computeDailySummary(
  activities: readonly unknown[],
  options: { dayStart: DateTime; dayEnd: DateTime; zone?: string; referenceTime?: DateTime }
): DailySummary {
  const { dayStart, dayEnd, zone = 'local' } = options;
  const referenceTime = options.referenceTime ?? DateTime.now();

  // Parse and filter to the given day range
  const todaysActivities: Activity[] = [];
  for (const a of activities) {
    const act = parseActivity(a);
    if (!act) continue;
    const ts = act.timestamp;
    if (!ts) continue;
    const dt = DateTime.fromISO(ts, { zone });
    if (!dt.isValid) continue;
    if (dt < dayStart || dt > dayEnd) continue;
    todaysActivities.push(act);
  }

  // Sort by timestamp ascending (needed for stable "last seen" tracking)
  todaysActivities.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Aggregate feed
  let bottleTotalMl = 0;
  let bottleCount = 0;
  let latchLeftTotal = 0;
  let latchRightTotal = 0;
  let latchCount = 0;
  let solidsCount = 0;

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
        } else if (ft === 'latch') {
          latchCount++;
          latchLeftTotal += (act.feed.duration?.left?.seconds as number) ?? 0;
          latchRightTotal += (act.feed.duration?.right?.seconds as number) ?? 0;
        } else if (ft === 'solids') {
          solidsCount++;
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
        }
      : null;

  const latchBlock =
    latchCount > 0
      ? { totalSeconds: latchLeftTotal + latchRightTotal }
      : null;

  const solidsBlock = solidsCount > 0 ? { count: solidsCount } : null;

  const diaperBlock =
    wetCount + dirtyCount + mixedCount > 0
      ? {
          wet: wetCount,
          dirty: dirtyCount,
          mixed: mixedCount,
          total: wetCount + dirtyCount + mixedCount,
          lastWetAgoMs: lastWetTs
            ? referenceTime.toMillis() - DateTime.fromISO(lastWetTs, { zone }).toMillis()
            : null,
          lastDirtyAgoMs: lastDirtyTs
            ? referenceTime.toMillis() - DateTime.fromISO(lastDirtyTs, { zone }).toMillis()
            : null,
          lastMixedAgoMs: lastMixedTs
            ? referenceTime.toMillis() - DateTime.fromISO(lastMixedTs, { zone }).toMillis()
            : null,
          lastWetAt: lastWetTs,
          lastDirtyAt: lastDirtyTs,
          lastMixedAt: lastMixedTs,
        }
      : null;

  const latestTemp =
    latestTempValue !== null && latestTempTs !== null
      ? {
          valueC: latestTempValue,
          agoMs: referenceTime.toMillis() - DateTime.fromISO(latestTempTs, { zone }).toMillis(),
          at: latestTempTs,
        }
      : null;

  const medicines = Array.from(medicineMap.values());

  const medicalBlock =
    latestTemp !== null || medicines.length > 0 ? { latestTemperature: latestTemp, medicines } : null;

  const hasAny =
    bottleBlock !== null || latchBlock !== null || solidsBlock !== null || diaperBlock !== null;

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

// ── Per-day orchestrator ──────────────────────────────────────────────────────

/**
 * Groups activities into daily summary entries, one per calendar day present in
 * the input (newest day first).
 *
 * Each entry contains:
 *   - dateKey: 'YYYY-MM-DD' in the resolved zone (used by page.tsx for grouping)
 *   - dayStart: start-of-day in the resolved zone
 *   - summary: the aggregated DailySummary for that day
 *
 * Days where all activities result in hasAny=false are skipped.
 */
export interface DailySummaryEntry {
  dateKey: string;
  dayStart: DateTime;
  summary: DailySummary;
}

export function computeDailySummariesByDay(
  activities: readonly unknown[],
  options?: { zone?: string; referenceTime?: DateTime }
): DailySummaryEntry[] {
  const zone = options?.zone ?? 'local';
  const referenceTime = options?.referenceTime ?? DateTime.now();

  // Group activities by dateKey
  const dayMap = new Map<string, unknown[]>();
  for (const a of activities) {
    const act = parseActivity(a);
    if (!act || !act.timestamp) continue;
    const dt = DateTime.fromISO(act.timestamp, { zone });
    if (!dt.isValid) continue;
    const key = toDateKey(dt);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(a);
  }

  // Build entries newest-first (ISO string sort descending)
  const entries: DailySummaryEntry[] = [];
  const sortedKeys = Array.from(dayMap.keys()).sort().reverse();

  for (const dateKey of sortedKeys) {
    const dayActivities = dayMap.get(dateKey)!;
    const dayStart = DateTime.fromISO(dateKey + 'T00:00:00', { zone });
    const dayEnd = dayStart.endOf('day');
    const summary = computeDailySummary(dayActivities, { dayStart, dayEnd, zone, referenceTime });
    if (!summary.hasAny) continue;
    entries.push({ dateKey, dayStart, summary });
  }

  return entries;
}