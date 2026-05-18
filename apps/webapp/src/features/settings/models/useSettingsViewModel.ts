'use client';

import { useState } from 'react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

import { useAuthState } from '@/modules/auth/AuthProvider';

// ── Types ───────────────────────────────────────────────────────

export interface JoinRequest {
  _id: string;
  userId: string;
  status: string;
}

/** The full shape of the family data returned from the backend query. */
export interface FamilyData {
  _id: string;
  joinRequests?: JoinRequest[];
  [key: string]: unknown;
}

export interface SettingsViewModel {
  // ── Auth / identity ─────────────────────────────────────
  /** Whether the user is authenticated (always true in the settings page guard). */
  isAuthenticated: boolean;
  /** The authenticated user's name, or 'Anonymous user' fallback. */
  userName: string;
  /** Human-readable authentication method (Google / Anonymous / Unknown). */
  authMethod: string;

  // ── Family data ─────────────────────────────────────────
  /** True while the family query is loading. */
  familyLoading: boolean;
  /** The full family document, or null if the user is not in a family. */
  family: FamilyData | null;
  /** Whether the current user is in a family. */
  inFamily: boolean;

  // ── Family join requests ────────────────────────────────
  /** Pending join requests for this family. */
  pendingRequests: JoinRequest[];
  /** The family ID, if in a family. */
  familyId: string;

  // ── Local UI state ──────────────────────────────────────
  /** The text input value for joining a family by ID. */
  joinFamilyId: string;
  /** Setter for joinFamilyId. */
  setJoinFamilyId: (value: string) => void;
  /** True briefly (≈2 s) after the user copies the family ID. */
  copied: boolean;
  /** True briefly (≈3 s) after the invite link has been copied. */
  inviteCopied: boolean;
  /** True while the create-invite mutation is in-flight. */
  creatingInvite: boolean;
  /** True while the user is in the "are you sure?" step of leaving. */
  confirmLeave: boolean;
  /** True while any mutation is in-flight. */
  submitting: boolean;

  // ── Actions ─────────────────────────────────────────────
  /** Copy the current family ID to clipboard; resets copied after 2 s. */
  handleCopyFamilyId: () => Promise<void>;
  /** Create a new family for the current user. */
  handleCreateFamily: () => Promise<void>;
  /** Request to join an existing family by ID. Clears joinFamilyId on success. */
  handleRequestJoin: () => Promise<void>;
  /** Approve a pending join request (identified by userId). */
  handleApprove: (requesterUserId: string) => Promise<void>;
  /** Enter the "are you sure?" confirmation step for leaving the family. */
  handleConfirmLeave: () => void;
  /** Actually leave the family. Resets confirmLeave on completion. */
  handleLeave: () => Promise<void>;
  /** Cancel the "are you sure?" step without leaving. */
  handleCancelLeave: () => void;
  /** Create an invite link and copy it to clipboard. Resets inviteCopied after 3 s. */
  handleCreateInvite: () => Promise<void>;
}

// ── Hook ────────────────────────────────────────────────────────

/**
 * Provides all state and actions needed by the Settings page.
 *
 * Mirrors the logic previously in `apps/webapp/src/app/app/settings/page.tsx`
 * so the page component can remain thin.
 */
export function useSettingsViewModel(): SettingsViewModel {
  const authState = useAuthState();

  // ── Auth ────────────────────────────────────────────────
  const isAuthenticated = authState?.state === 'authenticated';

  const user = authState?.state === 'authenticated' ? authState.user : undefined;
  const userName = user?.name || 'Anonymous user';
  // Auth method from the session auth state (not the user document type).
  const authMethod =
    authState?.state === 'authenticated' && authState.authMethod
      ? authState.authMethod === 'google'
        ? 'Google'
        : authState.authMethod === 'anonymous'
          ? 'Anonymous'
          : authState.authMethod
      : 'Unknown';

  // ── Family query ────────────────────────────────────────
  const family = useSessionQuery(api.web.babyTracker.family.get);
  const familyLoading = family === undefined;

  // ── Mutations ────────────────────────────────────────────
  const initUser = useSessionMutation(api.web.babyTracker.family.initUser);
  const requestJoin = useSessionMutation(api.web.babyTracker.family.requestJoin);
  const approveJoin = useSessionMutation(api.web.babyTracker.family.approveJoin);
  const leaveFamily = useSessionMutation(api.web.babyTracker.family.leave);
  const createInvite = useSessionMutation(api.web.babyTracker.family.createInvite);

  // ── Local UI state ───────────────────────────────────────
  const [joinFamilyId, setJoinFamilyId] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  // ── Derived ─────────────────────────────────────────────
  const inFamily = !!family;
  const familyData = family as FamilyData | null;
  const familyId: string = familyData?._id ?? '';
  const joinRequests: JoinRequest[] = familyData?.joinRequests ?? [];
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  // ── Actions ─────────────────────────────────────────────

  const handleCopyFamilyId = async () => {
    if (!familyId) return;
    try {
      await navigator.clipboard.writeText(familyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleCreateFamily = async () => {
    setSubmitting(true);
    try {
      await initUser();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!joinFamilyId.trim()) return;
    setSubmitting(true);
    try {
      await requestJoin({ familyId: joinFamilyId.trim() as Id<'family'> });
      setJoinFamilyId('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requesterUserId: string) => {
    setSubmitting(true);
    try {
      await approveJoin({ requesterUserId: requesterUserId as Id<'users'> });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmLeave = () => {
    setConfirmLeave(true);
  };

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      await leaveFamily();
    } finally {
      setConfirmLeave(false);
      setSubmitting(false);
    }
  };

  const handleCancelLeave = () => {
    setConfirmLeave(false);
  };

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const result = await createInvite({});
      const inviteUrl = `${window.location.origin}/invite/${result.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 3000);
    } catch (err) {
      console.error('Failed to create invite:', err);
    } finally {
      setCreatingInvite(false);
    }
  };

  return {
    // Auth
    isAuthenticated,
    userName,
    authMethod,

    // Family data
    familyLoading,
    family: familyData,
    inFamily,

    // Join requests
    pendingRequests,
    familyId,

    // Local UI state
    joinFamilyId,
    setJoinFamilyId,
    copied,
    confirmLeave,
    submitting,
    inviteCopied,
    creatingInvite,

    // Actions
    handleCopyFamilyId,
    handleCreateFamily,
    handleRequestJoin,
    handleApprove,
    handleConfirmLeave,
    handleLeave,
    handleCancelLeave,
    handleCreateInvite,
  };
}