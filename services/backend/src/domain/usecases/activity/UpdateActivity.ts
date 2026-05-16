/**
 * Usecase: Update an existing activity.
 * Validates the timestamp (business logic) before delegating to the repository.
 */
import { DateTime } from 'luxon';
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function updateActivity(
  repo: IActivityRepository,
  deviceId: string,
  activityId: string,
  activity: Activity
): Promise<void> {
  const ts = DateTime.fromISO(activity.timestamp);
  if (!ts.isValid) {
    throw new Error(`invalid timestamp: ${activity.timestamp}`);
  }
  await repo.update(deviceId, activityId, {
    ...activity,
    timestamp: ts.toUTC().toISO()!,
  });
}
