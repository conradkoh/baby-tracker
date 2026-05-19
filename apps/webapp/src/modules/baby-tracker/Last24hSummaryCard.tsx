'use client';

import { Milk, Baby, Clock } from 'lucide-react';
import { timeAgoFromMs } from '@/lib/activity-form-utils';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@workspace/backend/convex/_generated/api';

type Last24hSummary = FunctionReturnType<typeof api.web.babyTracker.activities.getLast24hSummary>;

interface Last24hSummaryCardProps {
  summary: Last24hSummary;
  nowMs: number;
}

export function Last24hSummaryCard({ summary, nowMs }: Last24hSummaryCardProps) {
  if (!summary.hasAny) return null;

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
              {feed.lastFeedAtMs !== null ? (
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                  <span>Last:</span>
                  <span className="text-foreground">{timeAgoFromMs(nowMs - feed.lastFeedAtMs)}</span>
                  {feed.last3hMl > 0 && (
                    <>
                      <span>3h:</span>
                      <span className="font-medium text-foreground">{feed.last3hMl} ml</span>
                    </>
                  )}
                  {feed.bottleCount >= 1 && (
                    <>
                      <span>24h:</span>
                      <span className="font-medium text-foreground">{feed.total24hMl} ml</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="italic">No feeds</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Baby className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground mb-0.5">Diapers</p>
            <div className="text-xs text-muted-foreground">
              {diapers.total > 0 ? (
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                  {diapers.wet > 0 && (
                    <>
                      <span>Wet:</span>
                      <span className="font-medium text-foreground">{diapers.wet}</span>
                    </>
                  )}
                  {diapers.mixed > 0 && (
                    <>
                      <span>Mixed:</span>
                      <span className="font-medium text-foreground">{diapers.mixed}</span>
                    </>
                  )}
                  {diapers.dirty > 0 && (
                    <>
                      <span>Dirty:</span>
                      <span className="font-medium text-foreground">{diapers.dirty}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="italic">No changes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}