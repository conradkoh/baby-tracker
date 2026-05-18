'use client';

import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountCard } from '@/features/settings/components/AccountCard';
import { FamilyCard } from '@/features/settings/components/FamilyCard';
import { useSettingsViewModel } from '@/features/settings/models/useSettingsViewModel';

// ── Page Component ──────────────────────────────────────────────

export default function SettingsPage() {
  const vm = useSettingsViewModel();

  // ── Loading state ───────────────────────────────────────────

  if (vm.familyLoading) {
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

  if (!vm.isAuthenticated) {
    return null;
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <AccountCard userName={vm.userName} authMethod={vm.authMethod} />

      <FamilyCard
        family={vm.family}
        pendingRequests={vm.pendingRequests}
        copied={vm.copied}
        confirmLeave={vm.confirmLeave}
        onCopy={vm.handleCopyFamilyId}
        onApprove={vm.handleApprove}
        onLeave={vm.handleLeave}
        onConfirmLeave={vm.handleConfirmLeave}
        onCancelLeave={vm.handleCancelLeave}
        joinFamilyId={vm.joinFamilyId}
        setJoinFamilyId={vm.setJoinFamilyId}
        onCreateFamily={vm.handleCreateFamily}
        onRequestJoin={vm.handleRequestJoin}
        submitting={vm.submitting}
        inviteCopied={vm.inviteCopied}
        creatingInvite={vm.creatingInvite}
        onCreateInvite={vm.handleCreateInvite}
        isCreator={vm.isCreator}
        invites={vm.invites}
        invitesLoading={vm.invitesLoading}
        revokingId={vm.revokingId}
        onRevokeInvite={vm.handleRevokeInvite}
        members={vm.members}
        membersLoading={vm.membersLoading}
        removingId={vm.removingId}
        currentUserId={vm.currentUserId}
        onRemoveMember={vm.handleRemoveMember}
      />
    </div>
  );
}