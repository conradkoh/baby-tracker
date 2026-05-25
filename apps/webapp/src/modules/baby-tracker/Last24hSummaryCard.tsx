'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Milk, Baby, Clock, Pill, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  vitaminDTipEnabled?: boolean;
}

type Recommendation = {
  key: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
};

function getRecommendations(
  summary: Last24hSummary,
  vitaminDTipEnabled: boolean | undefined,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const { allFeedsAreBreastMilk, hasVitaminDInLast24h } = summary;
  if (allFeedsAreBreastMilk && !hasVitaminDInLast24h && vitaminDTipEnabled !== false) {
    recs.push({
      key: 'vitamin-d',
      title: 'Consider a Vitamin D supplement',
      body: "Exclusively breastfed babies don't get enough Vitamin D from milk alone. Health authorities recommend 400 IU/day from birth. We noticed all feeds in the last 24h were breast milk and no Vitamin D was logged.",
      ctaLabel: 'Log Vitamin D now',
      ctaRoute: '/app/medical/create?tab=vitamin',
    });
  }
  return recs;
}

function RecommendationCard({
  rec,
  onCtaClick,
}: {
  rec: Recommendation;
  onCtaClick: () => void;
}) {
  return (
    <div className="p-3 flex flex-col gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
      <div className="flex items-center gap-2">
        <Pill className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          {rec.title}
        </h3>
      </div>
      <p className="text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/85">
        {rec.body}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/50 gap-1.5"
        onClick={onCtaClick}
      >
        <span>{rec.ctaLabel}</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function Last24hSummaryCard({ summary, nowMs, vitaminDTipEnabled }: Last24hSummaryCardProps) {
  const router = useRouter();

  if (!summary) {
    return (
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg mb-6">
        <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
          <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
            Last 24h
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 px-4 pb-2">
          <div className="col-span-2 space-y-1.5">
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
  const recommendations = getRecommendations(summary, vitaminDTipEnabled);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg mb-6">
      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1">
        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
          Last 24h
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pb-2">
        <div className="col-span-2 flex items-start gap-2">
          <Milk className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
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

      {recommendations.length > 0 && (
        <div className="border-t border-red-200 dark:border-red-900">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-expanded={isExpanded}
            aria-controls="last24h-recommendations-list"
          >
            <span>
              {recommendations.length}{' '}
              {recommendations.length === 1 ? 'recommendation' : 'recommendations'}{' '}
              available
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div
              id="last24h-recommendations-list"
              className="px-4 pb-3 pt-1 flex flex-col gap-2"
            >
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.key}
                  rec={rec}
                  onCtaClick={() => router.push(rec.ctaRoute)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}