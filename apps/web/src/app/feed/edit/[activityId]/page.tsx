'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
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

export default function FeedEditPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.activityId as string;
  const deviceId = useDeviceId();
  const activityIdTyped = activityId as Id<'activities'>;

  const activity = useQuery(
    api.web.babyTracker.activities.getById,
    deviceId ? { deviceId, activityId: activityIdTyped } : 'skip'
  );

  const updateActivity = useMutation(api.web.babyTracker.activities.update);
  const deleteActivity = useMutation(api.web.babyTracker.activities.deleteActivity);

  const [feedType, setFeedType] = useState<FeedType>('latch');
  const [timestamp, setTimestamp] = useState('');
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  const [volumeMl, setVolumeMl] = useState('');
  const [solidsDesc, setSolidsDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Populate form when activity data loads
  useEffect(() => {
    if (initialized || !activity) return;
    const a = activity as any;

    const feed = a.feed || a;
    const feedSubType = feed?.type as FeedType;
    if (feedSubType) setFeedType(feedSubType);

    if (a.timestamp || a.activity?.timestamp) {
      const ts = DateTime.fromISO(a.timestamp || a.activity?.timestamp);
      if (ts.isValid) setTimestamp(ts.toFormat("yyyy-MM-dd'T'HH:mm"));
    }

    if (feedSubType === 'latch' && feed?.duration) {
      setLeftSeconds(feed.duration.left?.seconds || 0);
      setRightSeconds(feed.duration.right?.seconds || 0);
    }

    if (['expressed', 'formula', 'water'].includes(feedSubType) && feed?.volume) {
      setVolumeMl(String(feed.volume.ml || ''));
    }

    if (feedSubType === 'solids') {
      setSolidsDesc(feed?.description || '');
    }

    setInitialized(true);
  }, [activity, initialized]);

  const isFuture = timestamp ? DateTime.fromISO(timestamp) > DateTime.now() : false;

  const handleUpdate = async (e: React.FormEvent) => {
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

      let activityPayload: any = {
        timestamp: ts.toUTC().toISO(),
        type: 'feed',
      };

      if (feedType === 'latch') {
        activityPayload.feed = {
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
        activityPayload.feed = { type: feedType, volume: { ml } };
      } else if (feedType === 'solids') {
        if (!solidsDesc.trim()) {
          setError('Please enter a description');
          setSubmitting(false);
          return;
        }
        activityPayload.feed = { type: 'solids', description: solidsDesc.trim() };
      }

      await updateActivity({ deviceId, activityId: activityIdTyped, activity: activityPayload });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to update activity');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deviceId) return;
    setDeleting(true);
    try {
      await deleteActivity({ activityId: activityIdTyped });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 z-40">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-gray-500 mr-3 text-lg">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Edit Feed</h1>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </header>

      {!activity && deviceId && (
        <div className="flex items-center justify-center h-40 text-gray-400">
          Loading...
        </div>
      )}

      {activity && (
        <form onSubmit={handleUpdate} className="p-4">
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
            disabled={submitting}
            className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {submitting ? 'Saving...' : 'Update Feed'}
          </button>
        </form>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Feed?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
