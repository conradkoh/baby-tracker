import Page from '../../../components/organisms/Page';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../services/api';
import { FeedForm, FeedFormRef } from '../../../components/molecules/FeedForm';
import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { ActivityType } from '@workspace/domain/entities/Activity';
import { FeedType } from '@workspace/domain/entities/Feed';
import { DateTime } from 'luxon';
export default function CreateFeedPage() {
  const p = useLocalSearchParams();
  const activityId = p['activityId'] as Id<'activities'>;
  const activity = useQuery(api.activities.getById, { id: activityId });
  const updateActivity = useMutation(api.activities.update);
  const feedFormRef = useRef<FeedFormRef>(null);
  useEffect(() => {
    if (activity?.activity.type === ActivityType.Feed) {
      const feed = activity.activity.feed;
      switch (feed.type) {
        case FeedType.Expressed:
        case FeedType.Formula: {
          feedFormRef.current?.load({
            type: feed.type as FeedType.Expressed | FeedType.Formula,
            timestamp: DateTime.fromISO(activity.activity.timestamp),
            volume: feed.volume.ml,
          });
          break;
        }
        case FeedType.Latch: {
          feedFormRef.current?.load({
            type: feed.type as FeedType.Latch,
            timestamp: DateTime.fromISO(activity.activity.timestamp),
            duration: {
              seconds: feed.duration.seconds,
            },
          });
          break;
        }
      }
    }
  }, [activity?.activity]);
  return (
    <Page title="Edit Feed">
      <FeedForm
        mode="edit"
        ref={feedFormRef}
        onSubmit={async function (formData): Promise<void> {
          const ts = formData.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + formData.timestamp);
          if (
            formData.type === FeedType.Expressed ||
            formData.type === FeedType.Formula
          ) {
            updateActivity({
              activityId,
              activity: {
                timestamp: ts,
                type: 'feed',
                feed: {
                  type: formData.type,
                  volume: {
                    ml: formData.volume,
                  },
                },
              },
            });
          }
          router.back();
        }}
      />
    </Page>
  );
}
