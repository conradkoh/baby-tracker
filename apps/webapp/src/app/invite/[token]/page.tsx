'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Baby, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useAuthState } from '@/modules/auth/AuthProvider';

export default function InvitePage() {
  const params = useParams();
  const token = (params.token as string) ?? '';
  const router = useRouter();
  const authState = useAuthState();

  const isAuthLoading = authState === undefined;
  const isAuthenticated = authState?.state === 'authenticated';

  // getInvite is public — use useQuery (not useSessionQuery) to avoid injecting sessionId
  const invite = useQuery(api.web.babyTracker.family.getInvite, { token });
  // Skip family query until authenticated — family.get requires auth and throws UNAUTHENTICATED otherwise
  const currentFamily = useSessionQuery(
    api.web.babyTracker.family.get,
    !isAuthenticated ? 'skip' : {}
  );
  const acceptInvite = useSessionMutation(api.web.babyTracker.family.acceptInvite);
  const switchFamily = useSessionMutation(api.web.babyTracker.family.switchFamily);

  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Loading state — wait for invite data and auth resolution
  if (invite === undefined || isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <Baby className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Join Family</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex justify-center mt-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Invalid/expired/used/revoked invite
  if (!invite.valid) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Invite Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {invite.reason === 'expired'
                ? 'This invite link has expired.'
                : invite.reason === 'used'
                  ? 'This invite link has already been used.'
                  : invite.reason === 'revoked'
                    ? 'This invite link has been revoked.'
                    : 'This invite link is invalid.'}
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button className="mt-4">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated — show login prompt (currentFamily was skipped, no need to wait)
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Baby className="h-5 w-5" />
              You&apos;ve been invited!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Log in to join this family and start tracking together.
            </p>
            <Link
              href={`/login?returnTo=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-block w-full"
            >
              <Button className="w-full">Login to Join</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wait for family query (only fires for authenticated users)
  if (currentFamily === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex justify-center mt-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const targetFamilyId = invite.familyId;
  const currentFamilyId = currentFamily?._id ?? null;

  // Already in THIS family
  if (currentFamilyId === targetFamilyId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              Already a Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You&apos;re already a member of this family.
            </p>
            <Link href="/app" className="mt-4 inline-block">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already in ANOTHER family
  if (currentFamilyId !== null) {
    return (
      <>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Switch Families?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Accepting this invite will leave your current family. If you are the only member,
                all of that family&apos;s data will be permanently deleted. If others are still in
                the family, they will keep the data.
              </p>
              <Button className="w-full" onClick={() => setShowSwitchDialog(true)}>
                Switch Families
              </Button>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch Families?</AlertDialogTitle>
              <AlertDialogDescription>
                This will leave your current family. If you are the only member, all of that
                family&apos;s data will be permanently deleted. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSwitching}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSwitching}
                onClick={async () => {
                  setIsSwitching(true);
                  try {
                    await switchFamily({ token });
                    toast.success('You switched families!');
                    setShowSwitchDialog(false);
                    router.push('/app');
                  } catch (err) {
                    console.error('Failed to switch families:', err);
                    toast.error('Failed to switch families. Please try again.');
                  } finally {
                    setIsSwitching(false);
                  }
                }}
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Switch Families'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Authenticated, not in a family, invite is valid — show join button
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Baby className="h-5 w-5" />
            Join the family
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited to join a family. Click below to confirm.
          </p>
          <Button
            className="w-full"
            onClick={async () => {
              try {
                await acceptInvite({ token });
                toast.success('You joined the family!');
                router.push('/app');
              } catch (err) {
                console.error('Failed to accept invite:', err);
                toast.error('Failed to join family. Please try again.');
              }
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Confirm Join
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
