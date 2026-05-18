'use client';

import { Copy, Check, LogOut, ShieldAlert, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { InvitesList } from './InvitesList';
import { FamilyMembers } from './FamilyMembers';

import type { InviteInfo } from '@/features/settings/models/useInvitesViewModel';
import type { FamilyMember } from '@/features/settings/models/useFamilyMembersViewModel';

export interface FamilyInFamilyProps {
  familyId: string;
  pendingRequests: Array<{ _id: string; userId: string; status: string }>;
  copied: boolean;
  confirmLeave: boolean;
  onCopy: () => void;
  onApprove: (userId: string) => void;
  onLeave: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  submitting: boolean;

  // Invite link
  inviteCopied: boolean;
  creatingInvite: boolean;
  onCreateInvite: () => void;

  // Invite management
  invites: InviteInfo[];
  invitesLoading: boolean;
  revokingId: string | null;
  onRevokeInvite: (inviteId: string) => void;

  // Member management
  members: FamilyMember[];
  membersLoading: boolean;
  removingId: string | null;
  currentUserId: string | null;
  onRemoveMember: (memberUserId: string) => void;
  isCreator: boolean;
}

/**
 * Family section content shown when the user is already in a family.
 * Displays the family ID with a copy button, pending join requests,
 * an inline confirmation flow for leaving, invite link creation,
 * invite list with revoke, and family member list with remove.
 */
export function FamilyInFamily({
  familyId,
  pendingRequests,
  copied,
  confirmLeave,
  onCopy,
  onApprove,
  onLeave,
  onConfirmLeave,
  onCancelLeave,
  submitting,
  inviteCopied,
  creatingInvite,
  onCreateInvite,
  invites,
  invitesLoading,
  revokingId,
  onRevokeInvite,
  members,
  membersLoading,
  removingId,
  currentUserId,
  onRemoveMember,
  isCreator,
}: FamilyInFamilyProps) {
  return (
    <div className="space-y-4">
      {/* Family ID with copy */}
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">Family ID</Label>
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-grow">{familyId}</code>
          <Button variant="outline" size="sm" onClick={onCopy} disabled={submitting}>
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
          <Label className="text-sm text-muted-foreground mb-2 block">Pending Join Requests</Label>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between bg-muted/50 p-2 rounded"
              >
                <span className="text-sm font-mono">{req.userId}</span>
                <Button size="sm" onClick={() => onApprove(req.userId)} disabled={submitting}>
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
          <Button variant="destructive" onClick={onConfirmLeave} disabled={submitting}>
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
              <Button variant="destructive" size="sm" onClick={onLeave} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm Leave
              </Button>
              <Button variant="outline" size="sm" onClick={onCancelLeave} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invite link */}
      <div className="border-t pt-4">
        <Label className="text-sm text-muted-foreground mb-2 block">
          Invite someone to your family
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateInvite}
          disabled={submitting || creatingInvite}
        >
          {creatingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {inviteCopied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            'Copy Invite Link'
          )}
        </Button>
      </div>

      {/* Creator-only sections */}
      {isCreator && (
        <>
          {/* Sent Invites */}
          <InvitesList
            invites={invites}
            isLoading={invitesLoading}
            revokingId={revokingId}
            onRevoke={onRevokeInvite}
          />
        </>
      )}

      {/* Family Members — visible to all members; remove action is shown only to creator */}
      <FamilyMembers
        members={members}
        isLoading={membersLoading}
        removingId={removingId}
        currentUserId={currentUserId}
        viewerIsCreator={isCreator}
        onRemove={onRemoveMember}
      />
    </div>
  );
}
