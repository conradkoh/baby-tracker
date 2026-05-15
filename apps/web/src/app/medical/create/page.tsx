'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import { useDeviceId } from '@/hooks/useDeviceId';
import { DateTime } from 'luxon';

type MedicalSubType = 'temperature' | 'medicine';

export default function MedicalCreatePage() {
  const router = useRouter();
  const deviceId = useDeviceId();
  const createActivity = useMutation(api.web.babyTracker.activities.create);

  const [subType, setSubType] = useState<MedicalSubType>('temperature');
  const [timestamp, setTimestamp] = useState(() => DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm"));
  const [tempValue, setTempValue] = useState('');
  const [medName, setMedName] = useState('');
  const [medValue, setMedValue] = useState('');
  const [medUnit, setMedUnit] = useState('ml');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFuture = DateTime.fromISO(timestamp) > DateTime.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) return;
    setError(null);
    setSubmitting(true);

    try {
      const ts = DateTime.fromISO(timestamp);
      if (!ts.isValid) {
        setError('Invalid timestamp');
        setSubmitting(false);
        return;
      }

      let activity: any = {
        timestamp: ts.toUTC().toISO(),
        type: 'medical',
      };

      if (subType === 'temperature') {
        const val = parseFloat(tempValue);
        if (isNaN(val)) {
          setError('Please enter a valid temperature');
          setSubmitting(false);
          return;
        }
        activity.medical = { type: 'temperature', temperature: { value: val } };
      } else {
        const val = parseFloat(medValue);
        if (!medName.trim()) {
          setError('Please enter a medicine name');
          setSubmitting(false);
          return;
        }
        if (isNaN(val) || val <= 0) {
          setError('Please enter a valid amount');
          setSubmitting(false);
          return;
        }
        activity.medical = {
          type: 'medicine',
          medicine: { name: medName.trim(), unit: medUnit || 'ml', value: val },
        };
      }

      await createActivity({ deviceId, activity });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to create activity');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 z-40">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-gray-500 mr-3 text-lg">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">New Medical Record</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Sub-type selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSubType('temperature')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-xl text-sm font-medium transition-colors border-2 ${
              subType === 'temperature'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🌡️</span>
            Temperature
          </button>
          <button
            type="button"
            onClick={() => setSubType('medicine')}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-xl text-sm font-medium transition-colors border-2 ${
              subType === 'medicine'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">💊</span>
            Medicine
          </button>
        </div>

        {/* Timestamp */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isFuture && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              ⚠️ This activity is in the future
            </p>
          )}
        </div>

        {/* Sub-type fields */}
        {subType === 'temperature' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 37.5"
            />
          </div>
        )}

        {subType === 'medicine' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.1"
                  value={medValue}
                  onChange={(e) => setMedValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={medUnit}
                  onChange={(e) => setMedUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ml"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !deviceId}
          className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Medical Record'}
        </button>
      </form>
    </div>
  );
}
