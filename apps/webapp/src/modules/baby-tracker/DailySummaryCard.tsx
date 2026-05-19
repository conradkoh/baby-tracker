'use client';

import { Milk, Baby, Stethoscope } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DailySummary } from '@/lib/daily-summary';
import { formatDuration, humanizeAgo, formatTime } from '@/lib/activity-form-utils';

interface DailySummaryCardProps {
  summary: DailySummary;
  /** When true, show "Xh ago" for diaper/medical times. When false, show absolute HH:mm. */
  isToday: boolean;
}

/** Capitalise + trim a description for display, max 30 chars. */
function cleanDescription(desc: string): string {
  const trimmed = desc.trim();
  return trimmed.length > 30 ? trimmed.slice(0, 27) + '…' : trimmed;
}

export function DailySummaryCard({ summary, isToday }: DailySummaryCardProps) {
  if (!summary.hasAny) return null;

  const { feed, diapers, medical } = summary;

  return (
    <Card className="mb-6 p-0 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
      <div className="px-4 py-2 border-b border-indigo-200 dark:border-indigo-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          Daily Summary
        </h2>
      </div>
      <div className="divide-y divide-indigo-200/60 dark:divide-indigo-800/60">
        {/* ── Feed section ──────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-2.5">
          {/* Icon chip */}
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Milk className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">Feed</p>

            {feed.bottle !== null || feed.latch !== null || feed.solids !== null ? (
              <>
                {feed.bottle !== null && (
                  <p className="text-xs text-muted-foreground">
                    Bottle:{' '}
                    <span className="font-medium text-foreground">
                      {feed.bottle.totalMl}ml
                    </span>
                    {` · ${feed.bottle.count} feed${feed.bottle.count !== 1 ? 's' : ''}`}
                    {(() => {
                      const active = feed.bottle.breakdown.filter((b) => b.count > 0);
                      if (active.length > 1) {
                        const parts = active.map(
                          (b) => `${b.count} ${b.subType}`
                        );
                        return <span className="text-muted-foreground"> ({parts.join(', ')})</span>;
                      }
                      return null;
                    })()}
                  </p>
                )}

                {feed.latch !== null && (
                  <p className="text-xs text-muted-foreground">
                    Latch:{' '}
                    <span className="font-medium text-foreground">
                      {feed.latch.count} session{feed.latch.count !== 1 ? 's' : ''}
                    </span>
                    {` · avg L ${formatDuration(feed.latch.avgLeftSeconds)} / R ${formatDuration(feed.latch.avgRightSeconds)}`}
                  </p>
                )}

                {feed.solids !== null && (
                  <p className="text-xs text-muted-foreground">
                    Solids:{' '}
                    <span className="font-medium text-foreground">
                      {feed.solids.count}
                    </span>
                    {feed.solids.descriptions.length > 0 && (
                      <>
                        {' · '}
                        {feed.solids.descriptions
                          .slice(0, 3)
                          .map((d) => cleanDescription(d))
                          .join(', ')}
                        {feed.solids.descriptions.length > 3 && (
                          <span className="text-muted-foreground">
                            {' +'}
                            {feed.solids.descriptions.length - 3} more
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">No records</p>
            )}
          </div>
        </div>

        {/* ── Diaper section ───────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-2.5">
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
            <Baby className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">Diapers</p>

            {diapers !== null && diapers.total > 0 ? (
              <>
                {/* Counts — omit zero types */}
                <p className="text-xs text-muted-foreground">
                  {[
                    diapers.wet > 0 ? `${diapers.wet} wet` : null,
                    diapers.mixed > 0 ? `${diapers.mixed} mixed` : null,
                    diapers.dirty > 0 ? `${diapers.dirty} dirty` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                {/* Informative "last X" — prefer wet, then mixed, then dirty */}
                {(() => {
                  const candidates: Array<{ label: string; agoMs: number | null; at: string | null }> = [
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

                  return (
                    <p className="text-xs text-muted-foreground">
                      Last {first.label}: {timeStr}
                    </p>
                  );
                })()}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">No records</p>
            )}
          </div>
        </div>

        {/* ── Medical section ──────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-2.5">
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">Medical</p>

            {medical !== null &&
            (medical.latestTemperature !== null || medical.medicines.length > 0) ? (
              <>
                {medical.latestTemperature !== null && (
                  <p className="text-xs text-muted-foreground">
                    Latest temp:{' '}
                    <span className="font-medium text-foreground">
                      {medical.latestTemperature.valueC}°C
                    </span>
                    {isToday
                      ? ` · ${humanizeAgo(medical.latestTemperature.agoMs)}`
                      : medical.latestTemperature.at
                      ? ` · at ${formatTime(medical.latestTemperature.at)}`
                      : null}
                  </p>
                )}

                {medical.medicines.map((med) => (
                  <p key={med.name} className="text-xs text-muted-foreground">
                    {med.name}:{' '}
                    {med.mixedUnits ? (
                      <span className="font-medium text-foreground">
                        {med.count} dose{med.count !== 1 ? 's' : ''} (mixed units)
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">
                          {med.totalValue} {med.unit}
                        </span>
                        {` over ${med.count} dose${med.count !== 1 ? 's' : ''}`}
                      </>
                    )}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">No records</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}