/**
 * Usecase: Update an existing activity.
 * Delegates to the repository, which handles the timestamp format conversion.
 *
 * The domain operates on epoch milliseconds. The repository converts between
 * epoch ms and ISO 8601 UTC strings for Convex storage.
 */
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function updateActivity(
  repo: IActivityRepository,
  deviceId: string,
  activityId: string,
  activity: Activity
): Promise<void> {
  await repo.update(deviceId, activityId, activity);
}
