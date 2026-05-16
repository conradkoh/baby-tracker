/**
 * Usecase: Create a new activity for a device.
 * Validates the timestamp (business logic) before delegating to the repository.
 */
import { DateTime } from 'luxon';
import type { IActivityRepository } from '../../repositories/IActivityRepository';
import type { Activity } from '../../activity/Activity';

export async function createActivity(
  repo: IActivityRepository,
  deviceId: string,
  activity: Activity
): Promise<string> {
  const ts = DateTime.fromISO(activity.timestamp);
  if (!ts.isValid) {
    throw new Error(`invalid timestamp: ${activity.timestamp}`);
  }
  return repo.create(deviceId, {
    ...activity,
    timestamp: ts.toUTC().toISO()!,
  });
}
