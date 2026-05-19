'use client';

import { Milk, Baby, ClipboardList } from 'lucide-react';
import { DailySummary } from '@/lib/daily-summary';
import { formatDuration, humanizeAgo, formatTime } from '@/lib/activity-form-utils';

interface DailySummaryCardProps {
  summary: DailySummary;
  /** When true, show "Xh ago" for diaper times. When false, show absolute HH:mm. */
  isToday: boolean;
}

export function DailySummaryCard({ summary, isToday }: DailySummaryCardProps) {
  if (!summary.hasAny) return null;

  const { feed, diapers } = summary;

  return (
    <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-border">
      {/* Header — part of the tinted block, not a separate strip */}
      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
        <ClipboardList className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
          Daily Summary
        </span>
      </div>

      {/* Feed + Diapers side-by-side */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-2">
        {/* ── Feed column ─────────────────────────────── */}
        <div className="flex items-start gap-2">
          <Milk className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground mb-0.5">Feed</p>
            <div className="text-xs text-muted-foreground">
              {feed.bottle !== null || feed.latch !== null || feed.solids !== null ? (
                <>
                  {feed.bottle !== null && (
                    <p>
                      Bottle: <span className="font-medium text-foreground">{feed.bottle.totalMl}ml</span>
                      {` · ${feed.bottle.count} feed${feed.bottle.count !== 1 ? 's' : ''}`}
                    </p>
                  )}
                  {feed.latch !== null && (
                    <p>
                      Latch: {formatDuration(feed.latch.totalSeconds)} total
                    </p>
                  )}
                  {feed.solids !== null && (
                    <p>
                      Solids: <span className="font-medium text-foreground">{feed.solids.count}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="italic">No records</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Diapers column ──────────────────────────── */}
        <div className="flex items-start gap-2">
          <Baby className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground mb-0.5">Diapers</p>
            <div className="text-xs text-muted-foreground">
              {diapers !== null && diapers.total > 0 ? (
                <>
                  <p>
                    {[
                      diapers.wet > 0 ? `${diapers.wet} wet` : null,
                      diapers.mixed > 0 ? `${diapers.mixed} mixed` : null,
                      diapers.dirty > 0 ? `${diapers.dirty} dirty` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {(() => {
                    const candidates = [
                      { label: 'wet', agoMs: diapers.lastWetAgoMs, at: diapers.lastWetAt },
                      { label: 'mixed', agoMs: diapers.lastMixedAgoMs, at: diapers.lastMixedAt },
                      { label: 'dirty', agoMs: diapers.lastDirtyAgoMs, at: diapers.lastDirtyAt },
                    ];
                    const first = candidates.find((c) => c.agoMs !== null);
                    if (!first) return null;
                    const timeStr = isToday
                      ? humanizeAgo(first.agoMs!)
                      : first.at
                      ? `at ${formatTime(first.at)}`
                      : null;
                    if (!timeStr) return null;
                    return <p>Last {first.label}: {timeStr}</p>;
                  })()}
                </>
              ) : (
                <p className="italic">No records</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}