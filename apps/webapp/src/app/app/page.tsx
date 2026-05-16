'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Clock, FlaskConical, Calendar, Loader2, Milk, Baby, Stethoscope } from 'lucide-react';
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

// ── Icons per activity type (Lucide components) ──────────────────

const ACTIVITY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  feed: Milk,
  diaper_change: Baby,
  medical: Stethoscope,
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

  let lastFeedTimestamp: string | null = null;
  let lastFeedDateMs = 0;

  const bottleFeedsIn24h: { dateMs: number; volumeMl: number }[] = [];

  for (const activity of activities) {
    const ts = activity.timestamp as string;
    const dateMs = new Date(ts).getTime();

    if (activity.type === 'feed') {
      if (dateMs <= now && dateMs > lastFeedDateMs) {
        lastFeedDateMs = dateMs;
        lastFeedTimestamp = ts;
      }

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
  const totalVol = bottleFeedsIn24h.reduce((sum, f) => sum + f.volumeMl, 0);
  const totalDurationMins = (latest.dateMs - earliest.dateMs) / (60 * 1000);
  if (totalDurationMins <= 0) return result;

  const minutelyVolume = (totalVol - latest.volumeMl) / totalDurationMins;
  result.threeHourlyVolume = Math.ceil(minutelyVolume * 60 * 3);
  result.twentyFourHourVolume = totalVol;
  result.isValid = true;
  return result;
}

// ── Quick Action Grid (shared across states) ────────────────────

function QuickActionGrid({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <button
        onClick={() => router.push('/app/feed/create')}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800 transition-colors"
      >
        <Milk className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Feed</span>
      </button>
      <button
        onClick={() => router.push('/app/diaper-change/create')}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border border-green-200 dark:border-green-800 transition-colors"
      >
        <Baby className="h-7 w-7 text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Diaper</span>
      </button>
      <button
        onClick={() => router.push('/app/medical/create')}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 transition-colors"
      >
        <Stethoscope className="h-7 w-7 text-rose-600 dark:text-rose-400" />
        <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">Medical</span>
      </button>
    </div>
  );
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryStats = useMemo(() => computeSummaryStats(results as any[]), [results]);

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

  if (!isAuthenticated) {
    return null;
  }

  // ── Loading state ───────────────────────────────────────────

  if (isLoading && results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Quick action grid — skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>

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
        <QuickActionGrid router={router} />

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
      <QuickActionGrid router={router} />

      {/* Summary card — only when feed data exists */}
      {summaryStats.lastFeedTimeAgo && (
        <Card className="mb-6 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-4">
              Feeding Summary
            </h2>
            <div className="flex justify-between">
              <div className="flex flex-col items-center flex-1 gap-0.5">
                <Clock className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <span className="text-xs text-rose-600 dark:text-rose-400 mt-1">Last Feed</span>
                <span className="text-base font-bold text-rose-900 dark:text-rose-200">
                  {summaryStats.lastFeedTimeAgo}
                </span>
              </div>
              <div className="flex flex-col items-center flex-1 gap-0.5">
                <FlaskConical className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <span className="text-xs text-rose-600 dark:text-rose-400 mt-1">3h Avg</span>
                <span className="text-base font-bold text-rose-900 dark:text-rose-200">
                  {summaryStats.threeHourlyVolume} ml
                </span>
              </div>
              <div className="flex flex-col items-center flex-1 gap-0.5">
                <Calendar className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <span className="text-xs text-rose-600 dark:text-rose-400 mt-1">24h Total</span>
                <span className="text-base font-bold text-rose-900 dark:text-rose-200">
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
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {formatDate(group.activities[0].timestamp as string)}
          </h3>

          <Card>
            <CardContent className="p-0">
              {group.activities.map((activity: any, idx: number) => {
                const { label, sub } = getActivityDisplay(activity);
                const IconComponent = ACTIVITY_ICON_MAP[activity.type as string];
                const isLast = idx === group.activities.length - 1;

                return (
                  <button
                    key={activity._id as string}
                    onClick={() => router.push(getEditPath(activity))}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors ${
                      !isLast ? 'border-b border-border' : ''
                    }`}
                  >
                    <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-muted">
                      {IconComponent ? (
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <span className="text-lg">📋</span>
                      )}
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
