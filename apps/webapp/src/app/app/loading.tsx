import { Skeleton } from '@/components/ui/skeleton';
import { Last24hSummaryCard } from '@/modules/baby-tracker/Last24hSummaryCard';
import { FeedSkeleton } from '@/modules/baby-tracker/FeedSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
      </div>

      <Last24hSummaryCard summary={undefined} nowMs={Date.now()} />

      <FeedSkeleton />
    </div>
  );
}
