'use client';

import { useState } from 'react';
import { User, Crown, Trash2, Loader2 } from 'lucide-react';

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

import type { FamilyMember } from '@/features/settings/models/useFamilyMembersViewModel';

// ── Role badge ─────────────────────────────────────────────────

function RoleBadge({ isCreator }: { isCreator: boolean }) {
  if (isCreator) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
        <Crown className="h-3 w-3" />
        Creator
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      Member
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────

export interface FamilyMembersProps {
  /** All members of the family. */
  members: FamilyMember[];
  /** True while the list query is loading. */
  isLoading?: boolean;
  /** The userId currently being removed, or null. */
  removingId: string | null;
  /** The current user's userId. */
  currentUserId: string | null;
  /** Called when user confirms removal. */
  onRemove: (memberUserId: string) => void;
}

/**
 * Displays the list of family members with creator/member badges
 * and a remove action (only shown to the creator, not for the creator themselves).
 */
export function FamilyMembers({
  members,
  isLoading,
  removingId,
  currentUserId,
  onRemove,
}: FamilyMembersProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm text-muted-foreground">Family Members</Label>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isRemoving={removingId === member.userId}
            isSelf={member.userId === currentUserId}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────

interface MemberRowProps {
  member: FamilyMember;
  isRemoving: boolean;
  isSelf: boolean;
  onRemove: (memberUserId: string) => void;
}

function MemberRow({ member, isRemoving, isSelf, onRemove }: MemberRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canRemove = !member.isCreator && !isSelf; // only creator can remove non-self non-creator members

  return (
    <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg">
      {/* Avatar */}
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted">
        <User className="h-4 w-4 text-muted-foreground" />
      </span>

      {/* Name + email */}
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
        {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
      </div>

      {/* Role badge */}
      <RoleBadge isCreator={member.isCreator} />

      {/* Remove button */}
      {canRemove ? (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-destructive hover:text-destructive h-7 px-2"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They will no longer have access to this family&apos;s activity feed. They can rejoin
                via a new invite link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDialogOpen(false);
                  onRemove(member.userId);
                }}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <div className="flex-shrink-0 w-7" />
      )}
    </div>
  );
}
