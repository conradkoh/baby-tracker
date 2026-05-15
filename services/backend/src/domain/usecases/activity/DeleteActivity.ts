/**
 * Usecase: Delete an activity by ID.
 */
import type { IActivityRepository } from '../../repositories/IActivityRepository';

export async function deleteActivity(
  repo: IActivityRepository,
  activityId: string
): Promise<void> {
  await repo.delete(activityId);
}
