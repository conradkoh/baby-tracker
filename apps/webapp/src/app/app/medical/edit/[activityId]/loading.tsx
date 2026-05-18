import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
