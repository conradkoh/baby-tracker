'use client';

// ── Types ─────────────────────────────────────────────────────

export interface FamilyMember {
  userId: string;
  name: string;
  userType: 'full' | 'anonymous';
  email?: string;
  isCreator: boolean;
}

export interface FamilyMembersViewModel {
  /** All members of the current user's family. */
  members: FamilyMember[];
  /** True while the listMembers query is loading. */
  isLoading: boolean;
  /** The userId of the member currently being removed, or null. */
  removingId: string | null;
  /** The current user's userId, or null if not authenticated. */
  currentUserId: string | null;
  /** Remove a member from the family. Only callable by the creator. */
  handleRemove: (memberUserId: string) => Promise<void>;
}