'use client';

import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { useState } from 'react';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useAuthState } from '@/modules/auth/AuthProvider';

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

// ── Hook ────────────────────────────────────────────────────────

/**
 * Provides the family members list and remove action for the Settings page.
 * Uses the backend listMembers / removeMember APIs.
 */
export function useFamilyMembersViewModel(): FamilyMembersViewModel {
  const authState = useAuthState();
  const currentUserId = authState?.state === 'authenticated' ? (authState.user?._id ?? null) : null;

  const members = useSessionQuery(api.web.babyTracker.family.listMembers);
  const removeMember = useSessionMutation(api.web.babyTracker.family.removeMember);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (memberUserId: string) => {
    setRemovingId(memberUserId);
    try {
      await removeMember({ memberUserId: memberUserId as Id<'users'> });
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return {
    members: (members as FamilyMember[] | undefined) ?? [],
    isLoading: members === undefined,
    removingId,
    currentUserId,
    handleRemove,
  };
}
