/**
 * Usecase: Create a new activity for a device.
 * Delegates to the repository, which handles the timestamp format conversion.
 *
 * The domain operates on epoch milliseconds. The repository converts between
 * epoch ms and ISO 8601 UTC strings for Convex storage.
 */
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function createActivity(
  repo: IActivityRepository,
  deviceId: string,
  activity: Activity
): Promise<string> {
  return repo.create(deviceId, activity);
}
