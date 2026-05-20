import type { IActivityRepository } from '../../repositories/IActivityRepository';
import { computeLast24hSummary, type Last24hSummary } from './ComputeLast24hSummary';

export async function getLast24hSummary(
  repo: IActivityRepository,
  nowMs: number
): Promise<Last24hSummary> {
  const fromMs = nowMs - 24 * 60 * 60 * 1000;
  const activities = await repo.listByTimestampRange('', fromMs, nowMs);
  return computeLast24hSummary(activities, nowMs);
}