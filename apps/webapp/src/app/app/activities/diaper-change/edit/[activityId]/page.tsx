'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

  const activityId = params?.activityId as string;

  // @ts-expect-error — api.web.babyTracker may not be in generated types yet
  const activity = useSessionQuery(api.web.babyTracker.activities.getById, {
    activityId,
  }) as Record<string, unknown> | undefined;

  // @ts-expect-error
  const updateActivity = useSessionMutation(api.web.babyTracker.activities.update);
  // @ts-expect-error
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

  // Loading state
  if (!initialized) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Edit Diaper Change</h1>
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

      router.push('/app/activities');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteActivity({ activityId } as any);
      router.push('/app/activities');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Diaper Change</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diaper Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={diaperType}
            onValueChange={(v) => setDiaperType(v as DiaperType)}
          >
            {DIAPER_TYPES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2 py-1">
                <RadioGroupItem value={value} id={`diaper-${value}`} />
                <Label htmlFor={`diaper-${value}`}>{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="datetime">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => router.push('/app/activities')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <div className="flex-grow" />
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}
