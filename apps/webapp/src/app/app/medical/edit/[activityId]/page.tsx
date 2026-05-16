'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';

// ── Medical types ───────────────────────────────────────────────

const MEDICAL_TYPES = ['temperature', 'medicine'] as const;
type MedicalType = (typeof MEDICAL_TYPES)[number];

const MEDICAL_LABELS: Record<MedicalType, string> = {
  temperature: 'Temperature',
  medicine: 'Medicine',
};

// ── Page Component ──────────────────────────────────────────────

export default function MedicalEditPage() {
  const router = useRouter();
  const params = useParams();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const activityId = params?.activityId as Id<'activities'>;

  const activity = useSessionQuery(api.web.babyTracker.activities.getById, {
    activityId,
  }) as Record<string, unknown> | undefined;

  const updateActivity = useSessionMutation(api.web.babyTracker.activities.update);
  const deleteActivity = useSessionMutation(api.web.babyTracker.activities.deleteActivity);

  const [medicalType, setMedicalType] = useState<MedicalType>('temperature');
  const [datetime, setDatetime] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Temperature
  const [tempValue, setTempValue] = useState('');

  // Medicine
  const [medName, setMedName] = useState('');
  const [medValue, setMedValue] = useState('');
  const [medUnit, setMedUnit] = useState('');

  // Pre-populate from loaded activity
  useEffect(() => {
    if (!activity || initialized) return;

    const med = activity.medical as Record<string, unknown> | undefined;
    const existingType = med?.type as string;
    const ts = activity.timestamp as string;

    setMedicalType((existingType as MedicalType) || 'temperature');
    setDatetime(ts ? ts.slice(0, 16) : '');

    if (existingType === 'temperature') {
      const temp = med?.temperature as { value: number } | undefined;
      setTempValue(String(temp?.value ?? ''));
    } else if (existingType === 'medicine') {
      const medicine = med?.medicine as { name: string; value: number; unit: string } | undefined;
      setMedName(medicine?.name ?? '');
      setMedValue(String(medicine?.value ?? ''));
      setMedUnit(medicine?.unit ?? '');
    }

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
        <h1 className="text-2xl font-bold mb-6">Edit Medical</h1>
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

      let medical: Record<string, unknown>;
      if (medicalType === 'temperature') {
        medical = {
          type: 'temperature',
          temperature: { value: Number(tempValue) || 0 },
        };
      } else {
        medical = {
          type: 'medicine',
          medicine: {
            name: medName || '',
            value: Number(medValue) || 0,
            unit: medUnit || '',
          },
        };
      }

      await updateActivity({
        activityId,
        activity: {
          timestamp,
          type: 'medical',
          medical,
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
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Medical</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medical Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={medicalType}
            onValueChange={(v) => setMedicalType(v as MedicalType)}
          >
            <TabsList className="w-full">
              {MEDICAL_TYPES.map((type) => (
                <TabsTrigger key={type} value={type} className="flex-1">
                  {MEDICAL_LABELS[type]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Temperature fields */}
          {medicalType === 'temperature' && (
            <div>
              <Label htmlFor="temp-value">Temperature Value (°C)</Label>
              <Input
                id="temp-value"
                type="number"
                step="0.1"
                min="30"
                max="45"
                placeholder="e.g. 37.5"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </div>
          )}

          {/* Medicine fields */}
          {medicalType === 'medicine' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="med-name">Medicine Name</Label>
                <Input
                  id="med-name"
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="med-value">Value</Label>
                  <Input
                    id="med-value"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={medValue}
                    onChange={(e) => setMedValue(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="med-unit">Unit</Label>
                  <Input
                    id="med-unit"
                    type="text"
                    placeholder="e.g. ml"
                    value={medUnit}
                    onChange={(e) => setMedUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DateTime */}
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
        <Button variant="outline" onClick={() => router.push('/app')}>
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
