/**
 * Domain entity types for baby-tracker devices.
 * Pure TypeScript — no Convex imports.
 */

export enum DeviceStatus {
  Active = 'active',
  Pending = 'pending',
}

export interface Device {
  deviceId: string;
  familyId?: string;
  deviceName?: string;
  osName?: string;
  osVersion?: string;
  brand?: string;
}
