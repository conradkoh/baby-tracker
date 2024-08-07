'use client';
import Image from 'next/image';
import { api } from '@workspace/backend/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { DateTime } from 'luxon';
export default function Home() {
  const activities = useQuery(api.activities.get);
  const createActivity = useMutation(api.activities.create);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <span className="whitespace-pre">
        {JSON.stringify(
          {
            activities,
          },
          null,
          2
        )}
      </span>
      <button
        onClick={() => {
          // //TODO: replace this with actual logic
          // createActivity({
          //   activity: {
          //     timestamp: DateTime.now().toISO(),
          //     type: 'diaper_change',
          //     diaperChange: {
          //       type: 'wet',
          //     },
          //   },
          // });
        }}
      >
        Test
      </button>
    </main>
  );
}
