'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type { InviteInfo, InviteStatus } from '@/features/settings/models/useInvitesViewModel';

// ── Status badge ───────────────────────────────────────────────

const STATUS_STYLES: Record<InviteStatus, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  used: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  expired: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  revoked: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<InviteStatus, string> = {
  pending: 'Pending',
  used: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
};

// ── Date formatter ─────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────

export interface InvitesListProps {
  /** All invites for this family. */
  invites: InviteInfo[];
  /** True while the list query is loading. */
  isLoading?: boolean;
  /** The inviteId currently being revoked, or null. */
  revokingId: string | null;
  /** Called when user confirms revoke. */
  onRevoke: (inviteId: string) => void;
}

/**
 * Displays a list of invites for the current family with status badges
 * and a revoke action for pending invites.
 */
export function InvitesList({ invites, isLoading, revokingId, onRevoke }: InvitesListProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm text-muted-foreground">Sent Invites</Label>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {invites.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground italic">No invites sent yet.</p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => (
            <InviteRow
              key={invite._id}
              invite={invite}
              isRevoking={revokingId === invite._id}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Invite row ────────────────────────────────────────────────

interface InviteRowProps {
  invite: InviteInfo;
  isRevoking: boolean;
  onRevoke: (inviteId: string) => void;
}

function InviteRow({ invite, isRevoking, onRevoke }: InviteRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canRevoke = invite.status === 'pending';

  return (
    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg">
      {/* Token short */}
      <code className="flex-shrink-0 text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        {invite.tokenShort}
      </code>

      {/* Date */}
      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {formatDate(invite.createdAt)}
      </span>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Status badge */}
      <span
        className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[invite.status]}`}
      >
        {STATUS_LABELS[invite.status]}
      </span>

      {/* Revoke button */}
      {canRevoke ? (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-destructive hover:text-destructive h-7 px-2"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this invite?</AlertDialogTitle>
              <AlertDialogDescription>
                This invite link will no longer work. Anyone who already used it will
                remain in the family.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDialogOpen(false);
                  onRevoke(invite._id);
                }}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Revoke Invite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        // Spacer to keep rows aligned
        <div className="flex-shrink-0 w-7" />
      )}
    </div>
  );
}