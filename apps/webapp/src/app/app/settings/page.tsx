'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Copy, Check, User, Users, LogOut, ShieldAlert } from 'lucide-react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';

// ── Page Component ──────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  // Family query — returns null if not in a family
  const family = useSessionQuery(api.web.babyTracker.family.get);
  const familyLoading = family === undefined;

  // Mutations
  const initUser = useSessionMutation(api.web.babyTracker.family.initUser);
  const requestJoin = useSessionMutation(api.web.babyTracker.family.requestJoin);
  const approveJoin = useSessionMutation(api.web.babyTracker.family.approveJoin);
  const leaveFamily = useSessionMutation(api.web.babyTracker.family.leave);

  // State
  const [joinFamilyId, setJoinFamilyId] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // All hooks before conditional returns

  if (!isAuthenticated) {
    return null;
  }

  // ── Helpers ─────────────────────────────────────────────────
  const user = authState.user as { name?: string; type?: string; email?: string } | undefined;
  const userName = user?.name || 'Anonymous user';
  const isAnonymous = user?.type === 'anonymous';
  const isGoogle = user?.type === 'google';
  const authMethod = isGoogle ? 'Google' : isAnonymous ? 'Anonymous' : user?.type || 'Unknown';

  const handleCopyFamilyId = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const familyData = family as any;
    if (familyData?._id) {
      await navigator.clipboard.writeText(familyData._id as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      await leaveFamily();
      setConfirmLeave(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────

  if (familyLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* ── Account Section ─────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="text-foreground font-medium">{userName}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Auth method</Label>
            <p className="text-foreground">{authMethod}</p>
          </div>
          <Link href="/app/profile">
            <Button variant="outline" size="sm">
              Manage Profile
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* ── Family Section ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {family ? renderInFamily(family as any) : renderNotInFamily()}
        </CardContent>
      </Card>
    </div>
  );

  // ── In-family sub-render ────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderInFamily(familyData: any) {
    const familyId: string = familyData._id ?? '';
    const joinRequests: Array<{ _id: string; userId: string; status: string }> =
      familyData.joinRequests ?? [];
    const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

    return (
      <div className="space-y-4">
        {/* Family ID with copy */}
        <div>
          <Label className="text-sm text-muted-foreground">Family ID</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-grow">
              {familyId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFamilyId}
              disabled={submitting}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Pending join requests */}
        {pendingRequests.length > 0 && (
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Pending Join Requests
            </Label>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex items-center justify-between bg-muted/50 p-2 rounded"
                >
                  <span className="text-sm font-mono">{req.userId}</span>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req.userId)}
                    disabled={submitting}
                  >
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave family */}
        <div className="border-t pt-4">
          {!confirmLeave ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmLeave(true)}
              disabled={submitting}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Leave Family
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Are you sure? This will remove you from the family.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLeave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Confirm Leave
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmLeave(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Not-in-family sub-render ────────────────────────────────

  function renderNotInFamily() {
    return (
      <div className="space-y-4">
        {/* Create family */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            You are not in a family yet.
          </Label>
          <Button
            onClick={handleCreateFamily}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Create Family
          </Button>
        </div>

        {/* Join family */}
        <div className="border-t pt-4">
          <Label className="text-sm text-muted-foreground mb-2 block">
            Or join an existing family:
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Family ID"
              value={joinFamilyId}
              onChange={(e) => setJoinFamilyId(e.target.value)}
              disabled={submitting}
              className="flex-grow"
            />
            <Button
              variant="outline"
              onClick={handleRequestJoin}
              disabled={submitting || !joinFamilyId.trim()}
            >
              Request to Join
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
