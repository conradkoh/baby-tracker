/**
 * Repository interface for baby-tracker activities.
 * Pure TypeScript — no framework dependencies.
 */
import type { Activity } from '../activity/Activity';

export interface PaginationOpts {
  numItems: number;
  cursor: string | null;
}

export interface PaginationResult<T> {
  page: T[];
  isDone: boolean;
  continueCursor: string;
}

export interface IActivityRepository {
  /**
   * Create a new activity for the given device.
   * Resolves the device's activity stream internally.
   */
  create(deviceId: string, activity: Activity): Promise<string>;

  /**
   * Update an existing activity. Verifies the activity belongs to the device.
   */
  update(deviceId: string, activityId: string, activity: Activity): Promise<void>;

  /**
   * Delete an activity by ID.
   */
  delete(activityId: string): Promise<void>;

  /**
   * Get a single activity by ID, verifying device access.
   */
  getById(deviceId: string, activityId: string): Promise<Activity | null>;

  /**
   * List activities for a device, paginated by timestamp descending.
   */
  listByDeviceTimestampDesc(
    deviceId: string,
    paginationOpts: PaginationOpts
  ): Promise<PaginationResult<Activity>>;

  /**
   * List activities whose timestamp falls within [fromIso, toIso] (inclusive),
   * ordered by timestamp ascending. Returns ALL matching activities (no pagination).
   * Intended for bounded windows like "last 24h".
   *
   * Both fromIso and toIso must be ISO 8601 UTC strings (suffixed with Z) so that
   * the Convex string-index comparison against the stored UTC timestamps is correct.
   * The stored activity.timestamp field is normalised to UTC by the Create/Update use cases.
   */
  listByTimestampRange(
    deviceId: string,
    fromIso: string,
    toIso: string
  ): Promise<Activity[]>;
}
