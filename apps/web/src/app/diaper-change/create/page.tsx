'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import { useDeviceId } from '@/hooks/useDeviceId';
import { DateTime } from 'luxon';

type DiaperType = 'wet' | 'dirty' | 'mixed';

const DIAPER_OPTIONS: { type: DiaperType; label: string; icon: string }[] = [
  { type: 'wet', label: 'Wet', icon: '💧' },
  { type: 'dirty', label: 'Dirty', icon: '💩' },
  { type: 'mixed', label: 'Mixed', icon: '💩💧' },
];

export default function DiaperChangeCreatePage() {
  const router = useRouter();
  const deviceId = useDeviceId();
  const createActivity = useMutation(api.web.babyTracker.activities.create);

  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [timestamp, setTimestamp] = useState(() => DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm"));
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

      await createActivity({
        deviceId,
        activity: {
          timestamp: ts.toUTC().toISO(),
          type: 'diaper_change',
          diaperChange: { type: diaperType },
        },
      });
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
          <h1 className="text-lg font-bold text-gray-900">New Diaper Change</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Diaper type selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex gap-2">
            {DIAPER_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setDiaperType(opt.type)}
                className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                  diaperType === opt.type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
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
          {submitting ? 'Saving...' : 'Save Diaper Change'}
        </button>
      </form>
    </div>
  );
}
