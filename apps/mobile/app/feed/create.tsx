import Page from '../../src/components/organisms/Page';
import { useMutation } from 'convex/react';
import { api } from '../../src/services/api';
import { FeedForm } from '../../src/components/molecules/FeedForm';
import { FeedType } from '@workspace/domain/entities/Feed';
import { router } from 'expo-router';
import { requestAllowFutureDate } from '../../src/lib/time/requestAllowFutureDate';
import { useDeviceId } from '../../src/hooks/useDeviceId';
export default function CreateFeedPage() {
  const createActivity = useMutation(api.activities.create);
  const deviceId = useDeviceId();
  return (
    <Page title="Create Feed">
      <FeedForm
        mode="create"
        onSubmit={async function (formData): Promise<void> {
          //get user permission to create feed for future date
          let allowCreate = true;
          if (formData.timestamp.toMillis() > Date.now()) {
            allowCreate = await requestAllowFutureDate(); //update creation based on user permission
          }
          if (allowCreate) {
            const ts = formData.timestamp.toISO();
            if (ts === null)
              throw new Error('invalid timestamp: ' + formData.timestamp);
            switch (formData.type) {
              case FeedType.Expressed:
              case FeedType.Formula: {
                //default: assume there is volume
                await createActivity({
                  deviceId,
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
                //default: assume there is volume
                await createActivity({
                  deviceId,
                  activity: {
                    timestamp: ts,
                    type: 'feed',
                    feed: {
                      type: formData.type,
                      duration: {
                        // seconds: formData.duration.seconds,
                        left: formData.duration.left,
                        right: formData.duration.right,
                      },
                    },
                  },
                });
                break;
              }
            }
            router.navigate('/');
          }
        }}
      />
    </Page>
  );
}
