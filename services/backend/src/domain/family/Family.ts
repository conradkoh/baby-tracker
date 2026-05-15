/**
 * Domain entity types for baby-tracker families.
 * Pure TypeScript — no Convex imports.
 */

export interface Child {
  iid: string;
  name: string;
  /** ISO date string (YYYY-MM-DD) */
  dateOfBirth: string;
}

export interface FamilyDevice {
  deviceId: string;
}

export interface FamilyJoinRequest {
  deviceId: string;
  familyId: string;
  /** 'pending' | 'rejected' */
  status: string;
  userId?: string;
}

export interface UserFamily {
  userId: string;
  familyId: string;
}

export interface Family {
  children: Child[];
  devices: FamilyDevice[];
  joinRequests?: FamilyJoinRequest[];
}
