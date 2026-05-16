'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Clock, FlaskConical, Calendar, Loader2 } from 'lucide-react';
import { useSessionPaginatedQuery } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';
import {
  formatTime,
  formatDate,
  toDateKey,
  formatDuration,
} from '@/lib/activity-form-utils';

// ── Helpers ─────────────────────────────────────────────────────

/** Get a human-readable label and sub-detail for an activity. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityDisplay(activity: any): { label: string; sub: string } {
  const type: string = activity.type;
  if (type === 'feed') {
    const feed = activity.feed;
    switch (feed.type) {
      case 'latch': {
        const leftSecs: number = feed.duration?.left?.seconds ?? 0;
        const rightSecs: number = feed.duration?.right?.seconds ?? 0;
        return {
          label: 'Latch Feed',
          sub: `L: ${formatDuration(leftSecs)} · R: ${formatDuration(rightSecs)}`,
        };
      }
      case 'expressed':
        return { label: 'Expressed Feed', sub: `${feed.volume.ml} ml` };
      case 'formula':
        return { label: 'Formula Feed', sub: `${feed.volume.ml} ml` };
      case 'water':
        return { label: 'Water Feed', sub: `${feed.volume.ml} ml` };
      case 'solids':
        return { label: 'Solids Feed', sub: feed.description as string };
    }
  }

  if (type === 'diaper_change') {
    const d = activity.diaperChange;
    const typeLabel: string = (d.type as string).charAt(0).toUpperCase() + (d.type as string).slice(1);
    return { label: 'Diaper Change', sub: typeLabel };
  }

  if (type === 'medical') {
    const med = activity.medical;
    switch (med.type) {
      case 'temperature':
        return { label: 'Temperature', sub: `${med.temperature.value} °C` };
      case 'medicine':
        return {
          label: 'Medicine',
          sub: `${med.medicine.value} ${med.medicine.unit} ${med.medicine.name}`,
        };
    }
  }

  return { label: 'Unknown', sub: '' };
}

/** Build the edit navigation path for an activity (new routes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEditPath(activity: any): string {
  switch (activity.type) {
    case 'feed':
      return `/app/feed/edit/${activity._id}`;
    case 'diaper_change':
      return `/app/diaper-change/edit/${activity._id}`;
    case 'medical':
      return `/app/medical/edit/${activity._id}`;
    default:
      return '/app';
  }
}

// ── Icons per activity type ─────────────────────────────────────

const activityIcons: Record<string, string> = {
  feed: '🍼',
  diaper_change: '🧷',
  medical: '💊',
};

// ── Summary Stats ───────────────────────────────────────────────

interface SummaryStats {
  isValid: boolean;
  lastFeedTimeAgo: string | null;
  threeHourlyVolume: number;
  twentyFourHourVolume: number;
}

/** Compute human-readable "time ago" string from milliseconds difference. */
function timeAgoFromMs(diffMs: number): string {
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Compute summary stats from activities (mirrors mobile logic). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeSummaryStats(activities: any[]): SummaryStats {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // Find last feed timestamp among recent feeds
  let lastFeedTimestamp: string | null = null;
  let lastFeedDateMs = 0;

  // Collect bottle feeds (expressed/formula/water, not latch/solids) in last 24hrs
  const bottleFeedsIn24h: { dateMs: number; volumeMl: number }[] = [];

  for (const activity of activities) {
    const ts = activity.timestamp as string;
    const dateMs = new Date(ts).getTime();

    if (activity.type === 'feed') {
      // Track most recent feed for "last feed" label
      if (dateMs <= now && dateMs > lastFeedDateMs) {
        lastFeedDateMs = dateMs;
        lastFeedTimestamp = ts;
      }

      // Track bottle feeds in last 24hrs
      const feedType = activity.feed?.type;
      if (
        (feedType === 'expressed' || feedType === 'formula' || feedType === 'water') &&
        dateMs > twentyFourHoursAgo &&
        dateMs <= now
      ) {
        bottleFeedsIn24h.push({
          dateMs,
          volumeMl: activity.feed?.volume?.ml ?? 0,
        });
      }
    }
  }

  // Sort bottle feeds by date (newest first)
  bottleFeedsIn24h.sort((a, b) => b.dateMs - a.dateMs);

  const result: SummaryStats = {
    isValid: false,
    lastFeedTimeAgo: null,
    threeHourlyVolume: 0,
    twentyFourHourVolume: 0,
  };

  if (lastFeedTimestamp) {
    result.lastFeedTimeAgo = timeAgoFromMs(now - lastFeedDateMs);
  }

  if (bottleFeedsIn24h.length < 2) return result;

  const latest = bottleFeedsIn24h[0];
  const earliest = bottleFeedsIn24h[bottleFeedsIn24h.length - 1];

  // Total volume
  const totalVol = bottleFeedsIn24h.reduce((sum, f) => sum + f.volumeMl, 0);

  // Duration between earliest and latest
  const totalDurationMins = (latest.dateMs - earliest.dateMs) / (60 * 1000);
  if (totalDurationMins <= 0) return result;

  const minutelyVolume = (totalVol - latest.volumeMl) / totalDurationMins;
  result.threeHourlyVolume = Math.ceil(minutelyVolume * 60 * 3);
  result.twentyFourHourVolume = totalVol;
  result.isValid = true;
  return result;
}

// ── Page Component ──────────────────────────────────────────────

export default function AppHomePage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const paginated = useSessionPaginatedQuery(
    api.web.babyTracker.activities.getByTimestampDescPaginated,
    {},
    { initialNumItems: 20 }
  );

  const results = paginated?.results ?? [];
  const status = paginated?.status ?? 'LoadingFirstPage';
  const isLoading = paginated?.isLoading ?? true;
  const loadMore = paginated?.loadMore;

  // Compute summary stats — must be above any conditional returns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryStats = useMemo(() => computeSummaryStats(results as any[]), [results]);

  // Group activities by date (newest first) — must be above any conditional returns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByDate = useMemo(() => {
    const groups: { date: string; activities: any[] }[] = [];
    for (const activity of results as any[]) {
      const ts: string = activity.timestamp;
      const dateKey = toDateKey(ts);
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.activities.push(activity);
      } else {
        groups.push({ date: dateKey, activities: [activity] });
      }
    }
    return groups;
  }, [results]);

  // Redirect unauthenticated users — after all hooks
  if (!isAuthenticated) {
    return null;
  }

  // ── Loading state ───────────────────────────────────────────

  if (isLoading && results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Skeleton summary card */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex justify-between">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skeleton activity rows */}
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <p className="text-center text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────

  if (!isLoading && results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/app/feed/create')}
          >
            Log Feed
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/app/diaper-change/create')}
          >
            Log Diaper
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/app/medical/create')}
          >
            Log Medical
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">No activities yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Log your first activity using the buttons above.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Activity feed with summary card ──────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/app/feed/create')}
          aria-label="Log Feed"
        >
          Log Feed
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/app/diaper-change/create')}
          aria-label="Log Diaper"
        >
          Log Diaper
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/app/medical/create')}
          aria-label="Log Medical"
        >
          Log Medical
        </Button>
      </div>

      {/* Summary card — only when feed data exists */}
      {summaryStats.lastFeedTimeAgo && (
        <Card className="mb-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-3">
              Activity Summary
            </h2>
            <div className="flex justify-between">
              <div className="flex flex-col items-center flex-1">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Last Feed
                </span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                  {summaryStats.lastFeedTimeAgo}
                </span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  3h Feed Avg
                </span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                  {summaryStats.threeHourlyVolume} ml
                </span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  24h Feed Total
                </span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                  {summaryStats.twentyFourHourVolume} ml
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped activity list */}
      {groupedByDate.map((group) => (
        <div key={group.date} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {formatDate(group.activities[0].timestamp as string)}
          </h3>

          <Card>
            <CardContent className="p-0">
              {group.activities.map((activity: any, idx: number) => {
                const { label, sub } = getActivityDisplay(activity);
                const icon = activityIcons[activity.type as string] ?? '📋';
                const isLast = idx === group.activities.length - 1;

                return (
                  <button
                    key={activity._id as string}
                    onClick={() => router.push(getEditPath(activity))}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors ${
                      !isLast ? 'border-b border-border' : ''
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 w-8 text-center" aria-hidden="true">
                      {icon}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{label}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(activity.timestamp as string)}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Load more */}
      {status === 'CanLoadMore' && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => loadMore?.(20)}>
            Load More
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {status === 'LoadingMore' && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
