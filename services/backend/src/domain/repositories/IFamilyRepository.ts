/**
 * Repository interface for baby-tracker families.
 * Pure TypeScript — no framework dependencies.
 */
import type { Family, FamilyJoinRequest } from '../family/Family';

export interface IFamilyRepository {
  /**
   * Create a new family for the given device.
   * Also creates the family activity stream and transfers device activities.
   */
  create(deviceId: string): Promise<string>;

  /**
   * Get a family by ID, including join requests.
   */
  getById(familyId: string): Promise<(Family & { joinRequests: FamilyJoinRequest[] }) | null>;

  /**
   * Delete a family. Only a device that belongs to the family can delete it.
   * Transfers family activities back to the authorizing device.
   */
  delete(authorizingDeviceId: string, familyId: string): Promise<void>;

  /**
   * Request to join a family.
   */
  requestJoin(familyId: string, deviceId: string): Promise<{ isError: boolean; message: string }>;

  /**
   * Approve a pending join request.
   */
  approveJoinRequest(familyId: string, deviceId: string, authorizingDeviceId: string): Promise<void>;

  /**
   * Leave a family. If the device is the last member, transfers family activities to device.
   */
  leave(deviceId: string, familyId: string): Promise<void>;
}
