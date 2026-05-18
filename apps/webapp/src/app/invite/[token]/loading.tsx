import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
