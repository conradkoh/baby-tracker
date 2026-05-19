import { DateTime } from 'luxon';
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Last24hSummary } from './ComputeLast24hSummary';
import { computeLast24hSummary } from './ComputeLast24hSummary';

export async function getLast24hSummary(
  repo: IActivityRepository,
  nowMs: number
): Promise<Last24hSummary> {
  const fromIso = DateTime.fromMillis(nowMs - 24 * 60 * 60 * 1000).toISO()!;
  const toIso = DateTime.fromMillis(nowMs).toISO()!;
  const activities = await repo.listByTimestampRange('', fromIso, toIso);
  return computeLast24hSummary(activities, nowMs);
}