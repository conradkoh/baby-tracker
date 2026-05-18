'use client';

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