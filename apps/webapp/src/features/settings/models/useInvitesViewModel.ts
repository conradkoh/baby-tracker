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

