'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Baby, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';

export default function InvitePage() {
  const params = useParams();
  const token = (params.token as string) ?? '';
  const router = useRouter();
  const authState = useAuthState();

  const isAuthenticated = authState?.state === 'authenticated';

  const invite = useSessionQuery(api.web.babyTracker.family.getInvite, { token });
  const currentFamily = useSessionQuery(api.web.babyTracker.family.get);
  const acceptInvite = useSessionMutation(api.web.babyTracker.family.acceptInvite);

  // Loading state
  if (invite === undefined || currentFamily === undefined) {
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

  // Invalid/expired/used invite
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
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Already in a Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You&apos;re already a member of another family. You must leave your current
              family before joining a new one.
            </p>
            <Link href="/app/settings" className="mt-4 inline-block">
              <Button className="mt-4">Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
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