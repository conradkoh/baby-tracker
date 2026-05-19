'use client';

import { Milk, Baby, Stethoscope } from 'lucide-react';
import { DateTime } from 'luxon';
import { Card } from '@/components/ui/card';
import { DailySummary } from '@/lib/daily-summary';
import { formatDuration, humanizeAgo } from '@/lib/activity-form-utils';

interface DailySummaryCardProps {
  summary: DailySummary;
}

/** Capitalise + trim a description for display, max 30 chars. */
function cleanDescription(desc: string): string {
  const trimmed = desc.trim();
  return trimmed.length > 30 ? trimmed.slice(0, 27) + '…' : trimmed;
}

export function DailySummaryCard({ summary }: DailySummaryCardProps) {
  if (!summary.hasAny) return null;

  const now = DateTime.now();
  const dateLabel = now.toFormat('ccc, d MMM');

  const { feed, diapers, medical } = summary;

  return (
    <Card className="mb-6 p-0">
      {/* Card header */}
      <div className="px-4 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today · {dateLabel}
        </span>
      </div>

      <div className="divide-y divide-border">
        {/* ── Feed section ──────────────────────────────── */}
        {feed.bottle !== null || feed.latch !== null || feed.solids !== null ? (
          <div className="flex items-start gap-3 px-4 py-2.5">
            {/* Icon chip */}
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Milk className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">Feed</p>

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
            </div>
          </div>
        ) : null}

        {/* ── Diaper section ───────────────────────────── */}
        {diapers !== null ? (
          <div className="flex items-start gap-3 px-4 py-2.5">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <Baby className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">Diapers</p>

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

              {/* Informative "last X ago" — prefer wet, then mixed, then dirty */}
              {(() => {
                const candidates: { label: string; agoMs: number | null }[] = [
                  { label: 'wet', agoMs: diapers.lastWetAgoMs },
                  { label: 'mixed', agoMs: diapers.lastMixedAgoMs },
                  { label: 'dirty', agoMs: diapers.lastDirtyAgoMs },
                ];
                const first = candidates.find((c) => c.agoMs !== null);
                if (!first) return null;
                return (
                  <p className="text-xs text-muted-foreground">
                    Last {first.label}: {humanizeAgo(first.agoMs!)}
                  </p>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* ── Medical section ──────────────────────────── */}
        {medical !== null ? (
          <div className="flex items-start gap-3 px-4 py-2.5">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">Medical</p>

              {medical.latestTemperature !== null && (
                <p className="text-xs text-muted-foreground">
                  Latest temp:{' '}
                  <span className="font-medium text-foreground">
                    {medical.latestTemperature.valueC}°C
                  </span>
                  {` · ${humanizeAgo(medical.latestTemperature.agoMs)} ago`}
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
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}