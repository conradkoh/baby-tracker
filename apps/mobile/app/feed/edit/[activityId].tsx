import Page from '../../../src/components/organisms/Page';
import { useMutation } from 'convex/react';
import { api } from '../../../src/services/api';
import {
  FeedForm,
  FeedFormRef,
} from '../../../src/components/molecules/FeedForm';
import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { ActivityType } from '@workspace/domain/entities/Activity';
import { FeedType } from '@workspace/domain/entities/Feed';
import { DateTime } from 'luxon';
import { Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '../../../src/lib/convex/use_query_swr';
import { useDeviceId } from '../../../src/hooks/useDeviceId';
export default function EditFeedPage() {
  const p = useLocalSearchParams();
  const activityId = p['activityId'] as Id<'activities'>;
  const deviceId = useDeviceId();
  const activity = useQuery(api.activities.getById, { deviceId, activityId });
  const updateActivity = useMutation(api.activities.update);
  const deleteActivity = useMutation(api.activities.deleteActivity);
  const feedFormRef = useRef<FeedFormRef>(null);
  useEffect(() => {
    if (activity?.activity.type === ActivityType.Feed) {
      const feed = activity.activity.feed;
      switch (feed.type) {
        case 'water':
        case 'expressed':
        case 'formula': {
          feedFormRef.current?.load({
            type: feed.type as FeedType.Expressed | FeedType.Formula,
            timestamp: DateTime.fromISO(activity.activity.timestamp),
            volume: feed.volume.ml,
          });
          break;
        }
        case 'latch': {
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
        case 'solids': {
          feedFormRef.current?.load({
            type: feed.type as FeedType.Solids,
            timestamp: DateTime.fromISO(activity.activity.timestamp),
            description: feed.description,
          });
          break;
        }
        default: {
          // exhaustive
          const _: never = feed;
          throw new Error(`invalid feed type: ${_}`);
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
          switch (formData.type) {
            case FeedType.Water:
            case FeedType.Expressed:
            case FeedType.Formula: {
              await updateActivity({
                deviceId,
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
              break;
            }
            case FeedType.Latch: {
              await updateActivity({
                deviceId,
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
              break;
            }
            case FeedType.Solids: {
              await updateActivity({
                deviceId,
                activityId,
                activity: {
                  timestamp: ts,
                  type: 'feed',
                  feed: {
                    type: formData.type,
                    description: formData.description,
                  },
                },
              });
              break;
            }
            default: {
              // exhaustive
              const _: never = formData;
              throw new Error(`invalid feed type: ${_}`);
            }
          }

          router.back();
        }}
      />
    </Page>
  );
}
