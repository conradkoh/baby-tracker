'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useSessionPaginatedQuery } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from '@/modules/auth/AuthProvider';

// ── Helpers ─────────────────────────────────────────────────────

/** Format a timestamp string to a short time like "2:30 PM". */
function formatTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format a timestamp to a locale date string like "Jan 15, 2025". */
function formatDate(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Get the date portion of an ISO timestamp as YYYY-MM-DD. */
function toDateKey(ts: string): string {
  return ts.slice(0, 10);
}

/** Convert seconds to a "X min Y sec" string. */
function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

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

/** Build the edit navigation path for an activity. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEditPath(activity: any): string {
  switch (activity.type) {
    case 'feed':
      return `/app/activities/feed/edit/${activity._id}`;
    case 'diaper_change':
      return `/app/activities/diaper-change/edit/${activity._id}`;
    case 'medical':
      return `/app/activities/medical/edit/${activity._id}`;
    default:
      return `/app/activities`;
  }
}

// ── Icons per activity type ─────────────────────────────────────

const activityIcons: Record<string, string> = {
  feed: '🍼',
  diaper_change: '🧷',
  medical: '💊',
};

// ── Page Component ──────────────────────────────────────────────

export default function ActivityListPage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const paginated = useSessionPaginatedQuery(
    // @ts-expect-error — api.web.babyTracker may not be in generated types yet
    api.web.babyTracker.activities.getByTimestampDescPaginated,
    {},
    { initialNumItems: 20 }
  );

  const results = paginated?.results ?? [];
  const status = paginated?.status ?? 'LoadingFirstPage';
  const isLoading = paginated?.isLoading ?? true;
  const loadMore = paginated?.loadMore;

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Group activities by date (newest first)
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

  // ── Loading state ───────────────────────────────────────────

  if (isLoading && results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Activities</h1>
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
        <h1 className="text-2xl font-bold mb-6">Activities</h1>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/app/activities/feed/create')}
          >
            Log Feed
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/app/activities/diaper-change/create')}
          >
            Log Diaper
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/app/activities/medical/create')}
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

  // ── Activity list ────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Activities</h1>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/app/activities/feed/create')}
          aria-label="Log Feed"
        >
          Log Feed
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/app/activities/diaper-change/create')}
          aria-label="Log Diaper"
        >
          Log Diaper
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/app/activities/medical/create')}
          aria-label="Log Medical"
        >
          Log Medical
        </Button>
      </div>

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
