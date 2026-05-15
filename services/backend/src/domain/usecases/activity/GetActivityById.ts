/**
 * Usecase: Get a single activity by ID, verifying device access.
 */
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function getActivityById(
  repo: IActivityRepository,
  deviceId: string,
  activityId: string
): Promise<Activity | null> {
  return repo.getById(deviceId, activityId);
}
