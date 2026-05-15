/**
 * Repository interface for baby-tracker devices.
 * Pure TypeScript — no framework dependencies.
 */
import type { Device } from '../device/Device';
import type { FamilyJoinRequest } from '../family/Family';

export interface IDeviceRepository {
  /**
   * Get a device by its deviceId.
   */
  getByDeviceId(deviceId: string): Promise<Device | null>;

  /**
   * Sync (create or update) a device record.
   * Also ensures activity streams exist for the device and its family (if any).
   */
  sync(params: {
    deviceId: string;
    deviceName?: string;
    osName?: string;
    osVersion?: string;
    brand?: string;
  }): Promise<void>;

  /**
   * Get family join requests for a device.
   */
  getFamilyJoinRequests(deviceId?: string): Promise<FamilyJoinRequest[]>;
}
