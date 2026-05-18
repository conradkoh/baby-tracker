'use client';

import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { FamilyData } from '@/features/settings/models/useSettingsViewModel';
import { FamilyInFamily } from './FamilyInFamily';
import { FamilyNotInFamily } from './FamilyNotInFamily';

interface SharedProps {
  copied: boolean;
  confirmLeave: boolean;
  onCopy: () => void;
  onApprove: (userId: string) => void;
  onLeave: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  submitting: boolean;
  joinFamilyId: string;
  setJoinFamilyId: (value: string) => void;
  onCreateFamily: () => void;
  onRequestJoin: () => void;
  inviteCopied: boolean;
  creatingInvite: boolean;
  onCreateInvite: () => void;
}

export interface FamilyCardProps extends SharedProps {
  /** The family document, or null if the user is not in a family. */
  family: FamilyData | null;
  /** Pending join requests for the current family. */
  pendingRequests: Array<{ _id: string; userId: string; status: string }>;
}

/**
 * Family management card for the Settings page.
 * Shows in-family content or not-in-family content based on `family`.
 */
export function FamilyCard({
  family,
  pendingRequests,
  ...rest
}: FamilyCardProps) {
  const inFamily = !!family;
  const familyId: string = family?._id ?? '';

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5" />
          Family
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {inFamily ? (
          <FamilyInFamily
            familyId={familyId}
            pendingRequests={pendingRequests}
            copied={rest.copied}
            confirmLeave={rest.confirmLeave}
            onCopy={rest.onCopy}
            onApprove={rest.onApprove}
            onLeave={rest.onLeave}
            onConfirmLeave={rest.onConfirmLeave}
            onCancelLeave={rest.onCancelLeave}
            submitting={rest.submitting}
            inviteCopied={rest.inviteCopied}
            creatingInvite={rest.creatingInvite}
            onCreateInvite={rest.onCreateInvite}
          />
        ) : (
          <FamilyNotInFamily
            joinFamilyId={rest.joinFamilyId}
            onJoinFamilyIdChange={rest.setJoinFamilyId}
            onCreateFamily={rest.onCreateFamily}
            onRequestJoin={rest.onRequestJoin}
            submitting={rest.submitting}
          />
        )}
      </CardContent>
    </Card>
  );
}