'use client';

// ── Types ─────────────────────────────────────────────────────

export interface FamilyMember {
  userId: string;
  name: string;
  userType: 'full' | 'anonymous';
  email?: string;
  isCreator: boolean;
}

