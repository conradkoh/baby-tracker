'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { getDefaultDatetime } from '@/lib/activity-form-utils';

// ── Medical types ───────────────────────────────────────────────

const MEDICAL_TYPES = ['temperature', 'medicine'] as const;
type MedicalType = (typeof MEDICAL_TYPES)[number];

const MEDICAL_LABELS: Record<MedicalType, string> = {
  temperature: 'Temperature',
  medicine: 'Medicine',
};

// ── Page Component ──────────────────────────────────────────────

export default function MedicalCreatePage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const createActivity = useSessionMutation(api.web.babyTracker.activities.create);

  const [medicalType, setMedicalType] = useState<MedicalType>('temperature');
  const [datetime, setDatetime] = useState(getDefaultDatetime());
  const [saving, setSaving] = useState(false);

  // Temperature
  const [tempValue, setTempValue] = useState('');

  // Medicine
  const [medName, setMedName] = useState('');
  const [medValue, setMedValue] = useState('');
  const [medUnit, setMedUnit] = useState('');

  // Unauthenticated guard — after all hooks
  if (!isAuthenticated) {
    return null;
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

      await createActivity({
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Log Medical</h1>

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
      </div>
    </div>
  );
}
