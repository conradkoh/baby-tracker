import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-8">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
