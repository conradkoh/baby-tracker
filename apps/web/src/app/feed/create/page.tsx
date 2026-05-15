'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import { useDeviceId } from '@/hooks/useDeviceId';
import { DateTime } from 'luxon';

type FeedType = 'latch' | 'expressed' | 'formula' | 'water' | 'solids';

const FEED_TABS: { type: FeedType; label: string; icon: string }[] = [
  { type: 'latch', label: 'Latch', icon: '🤱' },
  { type: 'expressed', label: 'Expressed', icon: '🍼' },
  { type: 'formula', label: 'Formula', icon: '🍼' },
  { type: 'water', label: 'Water', icon: '💧' },
  { type: 'solids', label: 'Solids', icon: '🥣' },
];

export default function FeedCreatePage() {
  const router = useRouter();
  const deviceId = useDeviceId();
  const createActivity = useMutation(api.web.babyTracker.activities.create);

  const [feedType, setFeedType] = useState<FeedType>('latch');
  const [timestamp, setTimestamp] = useState(() => DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm"));
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  const [volumeMl, setVolumeMl] = useState('');
  const [solidsDesc, setSolidsDesc] = useState('');
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
        type: 'feed',
      };

      if (feedType === 'latch') {
        activity.feed = {
          type: 'latch',
          duration: {
            left: { seconds: leftSeconds },
            right: { seconds: rightSeconds },
          },
        };
      } else if (['expressed', 'formula', 'water'].includes(feedType)) {
        const ml = parseInt(volumeMl, 10);
        if (isNaN(ml) || ml <= 0) {
          setError('Please enter a valid volume');
          setSubmitting(false);
          return;
        }
        activity.feed = { type: feedType, volume: { ml } };
      } else if (feedType === 'solids') {
        if (!solidsDesc.trim()) {
          setError('Please enter a description');
          setSubmitting(false);
          return;
        }
        activity.feed = { type: 'solids', description: solidsDesc.trim() };
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
          <h1 className="text-lg font-bold text-gray-900">New Feed</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Feed type tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setFeedType(tab.type)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                feedType === tab.type
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timestamp */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
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

        {/* Type-specific inputs */}
        {feedType === 'latch' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Left side (seconds)
              </label>
              <input
                type="number"
                min={0}
                value={leftSeconds}
                onChange={(e) => setLeftSeconds(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Right side (seconds)
              </label>
              <input
                type="number"
                min={0}
                value={rightSeconds}
                onChange={(e) => setRightSeconds(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {['expressed', 'formula', 'water'].includes(feedType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume (ml)
            </label>
            <input
              type="number"
              min={1}
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 120"
            />
          </div>
        )}

        {feedType === 'solids' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={solidsDesc}
              onChange={(e) => setSolidsDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Banana porridge"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !deviceId}
          className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Feed'}
        </button>
      </form>
    </div>
  );
}
