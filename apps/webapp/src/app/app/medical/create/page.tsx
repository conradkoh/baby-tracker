'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Stethoscope, ChevronLeft } from 'lucide-react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { getDefaultDatetime, toTimestamp } from '@/lib/activity-form-utils';

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
      const timestamp = toTimestamp(datetime);

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
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/app')}
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Stethoscope className="h-6 w-6 text-rose-600 dark:text-rose-400" />
        <h1 className="text-xl font-bold">Log Medical</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Medical Type</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
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

        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
            {/* Temperature fields */}
            {medicalType === 'temperature' && (
              <div className="space-y-1.5">
                <Label htmlFor="temp-value">Temperature Value (°C)</Label>
                <Input
                  id="temp-value"
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  placeholder="e.g. 37.5"
                  className="h-11"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              </div>
            )}

            {/* Medicine fields */}
            {medicalType === 'medicine' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="med-name">Medicine Name</Label>
                  <Input
                    id="med-name"
                    type="text"
                    placeholder="e.g. Paracetamol"
                    className="h-11"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="med-value">Value</Label>
                    <Input
                      id="med-value"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 5"
                      className="h-11"
                      value={medValue}
                      onChange={(e) => setMedValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="med-unit">Unit</Label>
                    <Input
                      id="med-unit"
                      type="text"
                      placeholder="e.g. ml"
                      className="h-11"
                      value={medUnit}
                      onChange={(e) => setMedUnit(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DateTime */}
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
