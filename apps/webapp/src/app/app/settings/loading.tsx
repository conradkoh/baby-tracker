import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Skeleton className="h-8 w-24 mb-6" />
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-6 w-20 mb-3" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
