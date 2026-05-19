'use client';

import { Milk, Baby, Stethoscope, Sparkles } from 'lucide-react';
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
    <div className="border-b border-border">
      {/* Header strip */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/30">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Daily Summary
        </span>
      </div>

      {/* Section rows — no dividers */}
      <div className="pb-1.5 pt-0.5">
        {/* ── Feed section ──────────────────────────────── */}
        <div className="flex items-start gap-2 px-4 py-1">
          <Milk className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground mb-0.5">Feed</p>
            <div className="text-xs text-muted-foreground">
              {feed.bottle !== null || feed.latch !== null || feed.solids !== null ? (
                <>
                  {feed.bottle !== null && (
                    <p>
                      Bottle: <span className="font-medium text-foreground">{feed.bottle.totalMl}ml</span>
                      {` · ${feed.bottle.count} feed${feed.bottle.count !== 1 ? 's' : ''}`}
                      {(() => {
                        const active = feed.bottle.breakdown.filter((b) => b.count > 0);
                        if (active.length > 1) {
                          return <span className="text-muted-foreground"> ({active.map((b) => `${b.count} ${b.subType}`).join(', ')})</span>;
                        }
                        return null;
                      })()}
                    </p>
                  )}
                  {feed.latch !== null && (
                    <p>
                      Latch: {feed.latch.count} session{feed.latch.count !== 1 ? 's' : ''}
                      {` · avg L ${formatDuration(feed.latch.avgLeftSeconds)} / R ${formatDuration(feed.latch.avgRightSeconds)}`}
                    </p>
                  )}
                  {feed.solids !== null && (
                    <p>
                      Solids: <span className="font-medium text-foreground">{feed.solids.count}</span>
                      {feed.solids.descriptions.length > 0 && (
                        <>
                          {' · '}
                          {feed.solids.descriptions.slice(0, 3).map((d) => cleanDescription(d)).join(', ')}
                          {feed.solids.descriptions.length > 3 && ` +${feed.solids.descriptions.length - 3} more`}
                        </>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="italic">No records</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Diaper section ───────────────────────────── */}
        <div className="flex items-start gap-2 px-4 py-1">
          <Baby className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
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

        {/* ── Medical section ──────────────────────────── */}
        <div className="flex items-start gap-2 px-4 py-1">
          <Stethoscope className="h-3 w-3 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground mb-0.5">Medical</p>
            <div className="text-xs text-muted-foreground">
              {medical !== null &&
              (medical.latestTemperature !== null || medical.medicines.length > 0) ? (
                <>
                  {medical.latestTemperature !== null && (
                    <p>
                      Latest temp: <span className="font-medium text-foreground">{medical.latestTemperature.valueC}°C</span>
                      {isToday
                        ? ` · ${humanizeAgo(medical.latestTemperature.agoMs)}`
                        : medical.latestTemperature.at
                        ? ` · at ${formatTime(medical.latestTemperature.at)}`
                        : null}
                    </p>
                  )}
                  {medical.medicines.map((med) => (
                    <p key={med.name}>
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
                <p className="italic">No records</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}