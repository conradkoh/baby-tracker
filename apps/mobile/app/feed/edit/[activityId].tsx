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
import { Text, TouchableOpacity, View } from 'react-native';
export default function CreateFeedPage() {
  const p = useLocalSearchParams();
  const activityId = p['activityId'] as Id<'activities'>;
  const activity = useQuery(api.activities.getById, { id: activityId });
  const updateActivity = useMutation(api.activities.update);
  const deleteActivity = useMutation(api.activities.deleteActivity);
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
              left: {
                seconds: feed.duration.left?.seconds || 0,
              },
              right: {
                seconds: feed.duration.right?.seconds || 0,
              },
            },
          });
          break;
        }
      }
    }
  }, [activity?.activity]);
  return (
    <Page title="Edit Feed">
      <View className=" items-end mr-2">
        <TouchableOpacity
          className="bg-red-300 p-2 rounded"
          onPress={() => {
            deleteActivity({ activityId });
            router.back();
          }}
        >
          <Text className="text-red-800">DELETE</Text>
        </TouchableOpacity>
      </View>
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
            await updateActivity({
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
          } else if (formData.type === FeedType.Latch) {
            await updateActivity({
              activityId,
              activity: {
                timestamp: ts,
                type: 'feed',
                feed: {
                  type: formData.type,
                  duration: {
                    left: formData.duration.left,
                    right: formData.duration.right,
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
