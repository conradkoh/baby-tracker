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
}
