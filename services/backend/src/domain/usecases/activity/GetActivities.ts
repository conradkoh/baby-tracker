/**
 * Usecase: Get paginated activities for a device, ordered by timestamp descending.
 */
import type { IActivityRepository, PaginationOpts, PaginationResult } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function getActivities(
  repo: IActivityRepository,
  deviceId: string,
  paginationOpts: PaginationOpts
): Promise<PaginationResult<Activity>> {
  return repo.listByDeviceTimestampDesc(deviceId, paginationOpts);
}
