'use client';

import { useDeviceId } from '@/hooks/useDeviceId';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────

interface FeedPayload {
  type: 'latch' | 'expressed' | 'formula' | 'water' | 'solids';
  duration?: { left?: { seconds?: number }; right?: { seconds?: number } };
  volume?: { ml: number };
  description?: string;
}

interface DiaperChangePayload {
  type: 'wet' | 'dirty' | 'mixed';
}

interface MedicalPayload {
  type: 'temperature' | 'medicine';
  temperature?: { value: number };
  medicine?: { name: string; unit: string; value: number };
}

interface ActivityData {
  timestamp: string;
  type: 'feed' | 'diaper_change' | 'medical';
  feed?: FeedPayload;
  diaperChange?: DiaperChangePayload;
  medical?: MedicalPayload;
}

interface ActivityDoc {
  _id: string;
  activity: ActivityData;
}

// ── Helpers ────────────────────────────────────────────────────

function getActivityEmoji(type: string): string {
  switch (type) {
    case 'feed': return '🍼';
    case 'diaper_change': return '💩';
    case 'medical': return '💊';
    default: return '📋';
  }
}

function getActivityLabel(type: string): string {
  switch (type) {
    case 'feed': return 'Feed';
    case 'diaper_change': return 'Diaper Change';
    case 'medical': return 'Medical';
    default: return type;
  }
}

function getEditPath(type: string, id: string): string {
  switch (type) {
    case 'feed': return `/feed/edit/${id}`;
    case 'diaper_change': return `/diaper-change/edit/${id}`;
    case 'medical': return `/medical/edit/${id}`;
    default: return '#';
  }
}

function formatSubInfo(activity: ActivityData): string {
  if (activity.type === 'feed' && activity.feed) {
    const f = activity.feed;
    if (f.type === 'latch' && f.duration) {
      const left = f.duration.left?.seconds
        ? `${Math.floor(f.duration.left.seconds / 60)}m ${f.duration.left.seconds % 60}s`
        : '—';
      const right = f.duration.right?.seconds
        ? `${Math.floor(f.duration.right.seconds / 60)}m ${f.duration.right.seconds % 60}s`
        : '—';
      return `Latch  L:${left}  R:${right}`;
    }
    if (f.volume) {
      return `${capitalize(f.type)} ${f.volume.ml}ml`;
    }
    if (f.type === 'solids') {
      return `Solids — ${f.description || ''}`;
    }
  }
  if (activity.type === 'diaper_change' && activity.diaperChange) {
    return capitalize(activity.diaperChange.type);
  }
  if (activity.type === 'medical' && activity.medical) {
    const m = activity.medical;
    if (m.type === 'temperature' && m.temperature) {
      return `Temperature ${m.temperature.value}°C`;
    }
    if (m.type === 'medicine' && m.medicine) {
      return `${m.medicine.name} ${m.medicine.value}${m.medicine.unit}`;
    }
  }
  return '';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDayHeader(ts: string): string {
  const dt = DateTime.fromISO(ts);
  const now = DateTime.now();
  if (dt.hasSame(now, 'day')) return 'Today';
  if (dt.hasSame(now.minus({ days: 1 }), 'day')) return 'Yesterday';
  return dt.toFormat('MMM d, yyyy');
}

function formatTime(ts: string): string {
  return DateTime.fromISO(ts).toFormat('h:mm a');
}

function timeAgo(ts: string): string {
  const relative = DateTime.fromISO(ts).toRelative();
  return relative || '';
}

// ── Feed Summary Widget ────────────────────────────────────────

function FeedSummary({ activities }: { activities: ActivityDoc[] }) {
  const now = DateTime.now();

  const feedActivities = activities
    .map((a) => a.activity)
    .filter((a) => a.type === 'feed');

  if (feedActivities.length === 0) return null;

  // Last Feed
  const lastFeed = feedActivities[0]; // sorted desc by timestamp

  // Bottle feeds (expressed, formula, water) for ml stats
  const bottleFeeds = feedActivities.filter(
    (a) =>
      a.feed?.type === 'expressed' ||
      a.feed?.type === 'formula' ||
      a.feed?.type === 'water'
  );

  // 3h Feed Avg
  const threeHoursAgo = now.minus({ hours: 3 });
  const recentBottles = bottleFeeds.filter((a) =>
    DateTime.fromISO(a.timestamp) > threeHoursAgo
  );
  const threeHrAvg =
    recentBottles.length > 0
      ? Math.round(
          recentBottles.reduce((sum, a) => sum + (a.feed?.volume?.ml || 0), 0) /
            recentBottles.length
        )
      : null;

  // 24h Feed Total
  const twentyFourHoursAgo = now.minus({ hours: 24 });
  const dayBottles = bottleFeeds.filter((a) =>
    DateTime.fromISO(a.timestamp) > twentyFourHoursAgo
  );
  const dayTotal = dayBottles.reduce(
    (sum, a) => sum + (a.feed?.volume?.ml || 0),
    0
  );

  return (
    <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-5 text-white mb-6 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-3">
        Feed Summary
      </h3>
      <div className="flex justify-between">
        <div className="text-center flex-1">
          <p className="text-xs opacity-70 mb-1">Last Feed</p>
          <p className="text-lg font-bold">
            {lastFeed ? timeAgo(lastFeed.timestamp) : '—'}
          </p>
        </div>
        <div className="text-center flex-1 border-l border-r border-white/20">
          <p className="text-xs opacity-70 mb-1">3h Feed Avg</p>
          <p className="text-lg font-bold">
            {threeHrAvg !== null ? `${threeHrAvg}ml` : '—'}
          </p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs opacity-70 mb-1">24h Feed Total</p>
          <p className="text-lg font-bold">{dayTotal}ml</p>
        </div>
      </div>
    </div>
  );
}

// ── Activity Row ───────────────────────────────────────────────

function ActivityRow({ doc }: { doc: ActivityDoc }) {
  const { _id, activity } = doc;
  return (
    <Link href={getEditPath(activity.type, _id)}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0">
        <span className="text-2xl">{getActivityEmoji(activity.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">
            {getActivityLabel(activity.type)}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {formatSubInfo(activity)}
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatTime(activity.timestamp)}
        </span>
      </div>
    </Link>
  );
}

// ── Day Group ──────────────────────────────────────────────────

function DayGroup({
  label,
  activities,
}: {
  label: string;
  activities: ActivityDoc[];
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-1">
        {label}
      </h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {activities.map((doc) => (
          <ActivityRow key={doc._id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

// ── Activity List ──────────────────────────────────────────────

function ActivityList({ activities }: { activities: ActivityDoc[] }) {
  const grouped = useMemo(() => {
    const groups: Map<string, ActivityDoc[]> = new Map();
    for (const doc of activities) {
      const key = formatDayHeader(doc.activity.timestamp);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    }
    return Array.from(groups.entries());
  }, [activities]);

  return (
    <div>
      {grouped.map(([label, docs]) => (
        <DayGroup key={label} label={label} activities={docs} />
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function Home() {
  const deviceId = useDeviceId();

  const { results, status, loadMore } = usePaginatedQuery(
    api.web.babyTracker.activities.getByTimestampDescPaginated,
    deviceId ? { deviceId } : 'skip',
    { initialNumItems: 20 }
  );

  const activities = (results || []) as unknown as ActivityDoc[];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Baby Tracker</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {deviceId === null && (
          <div className="flex items-center justify-center h-40 text-gray-400">
            Initializing...
          </div>
        )}

        {deviceId && status === 'LoadingFirstPage' && (
          <div className="flex items-center justify-center h-40 text-gray-400">
            Loading activities...
          </div>
        )}

        {deviceId && status !== 'LoadingFirstPage' && (
          <>
            <FeedSummary activities={activities} />

            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">👶</p>
                <p className="text-sm">No activities yet.</p>
                <p className="text-sm">
                  Tap 🍼, 💩, or 💊 below to log one!
                </p>
              </div>
            ) : (
              <>
                <ActivityList activities={activities} />

                {status === 'CanLoadMore' && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={() => loadMore(10)}
                      className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}

                {status === 'LoadingMore' && (
                  <div className="flex justify-center py-4 text-gray-400 text-sm">
                    Loading more...
                  </div>
                )}

                {status === 'Exhausted' && activities.length > 0 && (
                  <p className="text-center text-xs text-gray-300 py-4">
                    — All caught up! —
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
