import { DateTime } from 'luxon';
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Last24hSummary } from './ComputeLast24hSummary';
import { computeLast24hSummary } from './ComputeLast24hSummary';

export async function getLast24hSummary(
  repo: IActivityRepository,
  nowMs: number
): Promise<Last24hSummary> {
  // IMPORTANT: .toUTC() is required here because the stored activity.timestamp
  // is normalised to UTC (see CreateActivity.ts). Without .toUTC(), the offset
  // would depend on the server's local timezone, producing a local-offset ISO
  // string that breaks the Convex string-index comparison against UTC timestamps.
  // On most systems (including Convex servers) the local timezone is UTC, so
  // this happens to work today, but we explicitly force UTC for correctness.
  const fromIso = DateTime.fromMillis(nowMs - 24 * 60 * 60 * 1000).toUTC().toISO()!;
  const toIso = DateTime.fromMillis(nowMs).toUTC().toISO()!;
  const activities = await repo.listByTimestampRange('', fromIso, toIso);
  return computeLast24hSummary(activities, nowMs);
}