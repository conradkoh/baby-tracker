'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Baby, ChevronLeft } from 'lucide-react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';

// ── Diaper types ────────────────────────────────────────────────

const DIAPER_TYPES = [
  { value: 'wet', label: 'Wet' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'mixed', label: 'Mixed' },
] as const;

type DiaperType = (typeof DIAPER_TYPES)[number]['value'];

// ── Page Component ──────────────────────────────────────────────

export default function DiaperEditPage() {
  const router = useRouter();
  const params = useParams();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const activityId = params?.activityId as Id<'activities'> | undefined;

  const result = useSessionQuery(
    api.web.babyTracker.activities.getById,
    activityId ? { activityId } : 'skip'
  );

  const activity = result?.status === 'found'
    ? (result.data as Record<string, unknown>)
    : undefined;
  const isNotFound = result?.status === 'not_found';

  const updateActivity = useSessionMutation(api.web.babyTracker.activities.update);
  const deleteActivity = useSessionMutation(api.web.babyTracker.activities.deleteActivity);

  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [datetime, setDatetime] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pre-populate form when activity loads
  useEffect(() => {
    if (!activity || initialized) return;

    const dc = activity.diaperChange as Record<string, unknown> | undefined;
    const existingType = dc?.type as string;
    const ts = activity.timestamp as string;

    setDiaperType((existingType as DiaperType) || 'wet');
    setDatetime(ts ? ts.slice(0, 16) : '');
    setInitialized(true);
  }, [activity, initialized]);

  // Unauthenticated guard — after all hooks
  if (!isAuthenticated) {
    return null;
  }

  // 404 — activity not found
  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 pt-8 max-w-xl flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">Activity not found.</p>
        <Button variant="outline" onClick={() => router.push('/app')}>
          Go to Home
        </Button>
      </div>
    );
  }

  // Loading state
  if (!initialized) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push('/app')}
            className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Baby className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-bold">Edit Diaper Change</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <p className="text-center text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const timestamp = new Date(datetime).toISOString();

      await updateActivity({
        activityId,
        activity: {
          timestamp,
          type: 'diaper_change',
          diaperChange: { type: diaperType },
        },
      } as any);

      router.push('/app');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteActivity({ activityId } as any);
      router.push('/app');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/app')}
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Baby className="h-6 w-6 text-green-600" />
        <h1 className="text-xl font-bold">Edit Diaper Change</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Diaper Type</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {DIAPER_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDiaperType(value as DiaperType)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    diaperType === value
                      ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
            <div className="space-y-1.5 pt-4 border-t border-border">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                className="h-11"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => router.push('/app')}>Cancel</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          Delete
        </Button>
      </div>
    </div>
  );
}
