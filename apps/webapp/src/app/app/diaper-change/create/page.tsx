'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Baby, ChevronLeft } from 'lucide-react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

      router.push('/app');
    } finally {
      setSaving(false);
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
        <h1 className="text-xl font-bold">Log Diaper</h1>
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
      </div>
    </div>
  );
}
