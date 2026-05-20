/**
 * Usecase: Update an existing activity.
 * Validates the timestamp (business logic) before delegating to the repository.
 *
 * IMPORTANT: The timestamp is normalised to UTC before storing, identical to
 * CreateActivity.ts. All query surfaces that filter by timestamp must pass
 * ISO 8601 UTC strings (suffixed with Z) for correct string-index comparison.
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
    // Normalise to UTC, matching CreateActivity behaviour.
    timestamp: ts.toUTC().toISO()!,
  });
}
