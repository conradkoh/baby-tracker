'use client';

import { Milk, Baby, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedSkeleton() {
  return (
    <>
      {/* Two date groups to approximate the typical loaded feed */}
      {[0, 1].map((dg) => (
        <div key={dg} className="mb-6">
          {/* Date header */}
          <Skeleton className="h-3 w-20 mb-2 ml-1" />

          <Card className="overflow-hidden pt-0">
            <CardContent className="p-0">
              {/* DailySummaryCard placeholder */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-border rounded-t-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
                  <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 pb-2">
                  <div className="flex items-start gap-2">
                    <Milk className="h-3 w-3 text-blue-600/60 dark:text-blue-400/60 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3 w-8 mb-1.5" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Baby className="h-3 w-3 text-green-600/60 dark:text-green-400/60 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3 w-10 mb-1.5" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two time-of-day groups */}
              {[0, 1].map((tg) => (
                <div key={tg}>
                  <div className={`flex items-center gap-1.5 px-4 py-2 bg-muted/30 ${tg > 0 ? 'border-t border-border' : ''}`}>
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>

                  {/* 2-3 activity rows per time group */}
                  {[0, 1, 2].map((ar) => (
                    <div
                      key={ar}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border"
                    >
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <Skeleton className="h-3.5 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-3 w-10 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );
}
