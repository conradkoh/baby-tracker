'use client';

import { Milk, Baby, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgoFromMs } from '@/lib/activity-form-utils';
import type { Last24hSummary } from '@/lib/daily-summary';

const DASH = '\u2014';

/**
 * Formats a volume value. Always returns the unit so the row keeps a stable shape.
 * Examples: `90 ml`, `— ml`.
 */
function formatMl(ml: number, hasValue: boolean): string {
  return hasValue ? `${ml} ml` : `${DASH} ml`;
}

/**
 * Formats a latch duration. Always returns both units so the row keeps a stable shape.
 * Examples: `8 min 0 sec`, `— min — sec`.
 */
function formatLatch(totalSeconds: number, hasValue: boolean): string {
  if (!hasValue) return `${DASH} min ${DASH} sec`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

interface Last24hSummaryCardProps {
  summary: Last24hSummary | undefined;
  nowMs: number;
}

export function Last24hSummaryCard({ summary, nowMs }: Last24hSummaryCardProps) {
  if (!summary) {
    return (
      <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg mb-6">
        <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
          <Clock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
            Last 24h
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const { feed, diapers } = summary;

  return (
    <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg mb-6">
      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
        <Clock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
        <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
          Last 24h
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-2">
        <div className="flex items-start gap-2">
          <Milk className="h-3 w-3 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground mb-0.5">Feed</p>
            <div className="text-xs text-muted-foreground">
              <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5">
                <span>Last:</span>
                <span className="col-span-2 text-foreground">
                  {feed.lastFeedAtMs !== null ? timeAgoFromMs(nowMs - feed.lastFeedAtMs) : DASH}
                </span>
                <span>3h:</span>
                <span className="font-medium text-foreground">
                  {formatMl(feed.last3hMl, feed.last3hMl > 0)}
                </span>
                <span className="font-medium text-foreground">
                  {`· ${formatLatch(feed.last3hLatchSeconds, feed.last3hLatchSeconds > 0)}`}
                </span>
                <span>24h:</span>
                <span className="font-medium text-foreground">
                  {formatMl(feed.total24hMl, feed.bottleCount >= 1)}
                </span>
                <span className="font-medium text-foreground">
                  {`· ${formatLatch(feed.total24hLatchSeconds, feed.latchCount >= 1)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Baby className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground mb-0.5">Diapers</p>
            <div className="text-xs text-muted-foreground">
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                <span>Wet:</span>
                <span className="font-medium text-foreground">{diapers.wet > 0 ? diapers.wet : DASH}</span>
                <span>Mixed:</span>
                <span className="font-medium text-foreground">{diapers.mixed > 0 ? diapers.mixed : DASH}</span>
                <span>Dirty:</span>
                <span className="font-medium text-foreground">{diapers.dirty > 0 ? diapers.dirty : DASH}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}