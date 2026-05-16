'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { getDefaultDatetime } from '@/lib/activity-form-utils';

// ── Diaper types ────────────────────────────────────────────────

const DIAPER_TYPES = [
  { value: 'wet', label: 'Wet' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'mixed', label: 'Mixed' },
] as const;

type DiaperType = (typeof DIAPER_TYPES)[number]['value'];

// ── Page Component ──────────────────────────────────────────────

export default function DiaperCreatePage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  // @ts-expect-error — api.web.babyTracker may not be in generated types yet
  const createActivity = useSessionMutation(api.web.babyTracker.activities.create);

  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [datetime, setDatetime] = useState(getDefaultDatetime());
  const [saving, setSaving] = useState(false);

  // Unauthenticated guard — after all hooks
  if (!isAuthenticated) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const timestamp = new Date(datetime).toISOString();

      await createActivity({
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Log Diaper Change</h1>

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
      </div>
    </div>
  );
}
