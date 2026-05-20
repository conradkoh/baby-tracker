/**
 * Usecase: Create a new activity for a device.
 * Validates the timestamp (business logic) before delegating to the repository.
 *
 * IMPORTANT: The timestamp is normalised to UTC before storing.
 * All query surfaces that filter by timestamp must pass ISO 8601 UTC strings
 * (suffixed with Z) so that the Convex string-index comparison is correct.
 *
 * See also:
 *   - UpdateActivity.ts (same UTC normalisation)
 *   - GetLast24hSummary.ts (query bounds must be UTC)
 *   - IActivityRepository.listByTimestampRange (fromIso/toIso docs)
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
    // Normalise to UTC so string-index queries work correctly.
    // The client may send any ISO 8601 format (Z, +HH:MM, or bare local).
    timestamp: ts.toUTC().toISO()!,
  });
}
