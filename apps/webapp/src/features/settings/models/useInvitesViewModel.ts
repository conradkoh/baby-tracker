'use client';

import { useState } from 'react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

// ── Types ───────────────────────────────────────────────────────

export type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked';

export interface InviteInfo {
  _id: string;
  token: string;
  tokenShort: string;
  createdAt: number;
  status: InviteStatus;
  usedBy: string | null;
  expiresAt: number | null;
}

export interface InvitesViewModel {
  /** All invites for the current user's family. */
  invites: InviteInfo[];
  /** True while the listInvites query is loading. */
  isLoading: boolean;
  /** The inviteId currently being revoked, or null. */
  revokingId: string | null;
  /** Revoke a pending invite. Idempotent — safe to call repeatedly. */
  handleRevoke: (inviteId: string) => Promise<void>;
}

// ── Hook ────────────────────────────────────────────────────────

/**
 * Provides the invites list and revoke action for the Settings page.
 * Uses the backend listInvites / revokeInvite APIs.
 */
export function useInvitesViewModel(): InvitesViewModel {
  const invites = useSessionQuery(api.web.babyTracker.family.listInvites);
  const revokeInvite = useSessionMutation(api.web.babyTracker.family.revokeInvite);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      await revokeInvite({ inviteId: inviteId as Id<'familyInvites'> });
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    } finally {
      setRevokingId(null);
    }
  };

  return {
    invites: (invites as InviteInfo[] | undefined) ?? [],
    isLoading: invites === undefined,
    revokingId,
    handleRevoke,
  };
}