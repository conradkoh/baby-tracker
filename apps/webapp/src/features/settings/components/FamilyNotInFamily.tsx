'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface FamilyNotInFamilyProps {
  joinFamilyId: string;
  onJoinFamilyIdChange: (value: string) => void;
  onCreateFamily: () => void;
  onRequestJoin: () => void;
  submitting: boolean;
}

/**
 * Family section content shown when the user is not yet in a family.
 * Offers "Create Family" and "Request to Join" flows.
 */
export function FamilyNotInFamily({
  joinFamilyId,
  onJoinFamilyIdChange,
  onCreateFamily,
  onRequestJoin,
  submitting,
}: FamilyNotInFamilyProps) {
  return (
    <div className="space-y-4">
      {/* Create family */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">
          You are not in a family yet.
        </Label>
        <Button
          onClick={onCreateFamily}
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
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Family ID"
            value={joinFamilyId}
            onChange={(e) => onJoinFamilyIdChange(e.target.value)}
            disabled={submitting}
            className="flex-grow h-11"
          />
          <Button
            variant="outline"
            onClick={onRequestJoin}
            disabled={submitting || !joinFamilyId.trim()}
            className="h-11"
          >
            Request to Join
          </Button>
        </div>
      </div>
    </div>
  );
}