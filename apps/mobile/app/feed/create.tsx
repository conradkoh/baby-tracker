import Page from '../../components/organisms/Page';
import { useMutation } from 'convex/react';
import { api } from '../../services/api';
import { FeedForm } from '../../components/molecules/FeedForm';
import { FeedType } from '@workspace/domain/entities/Feed';
import { router } from 'expo-router';
export default function CreateFeedPage() {
  const createActivity = useMutation(api.activities.create);

  return (
    <Page title="Create Feed">
      <FeedForm
        mode="create"
        onSubmit={async function (formData): Promise<void> {
          const ts = formData.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + formData.timestamp);
          switch (formData.type) {
            case FeedType.Expressed:
            case FeedType.Formula: {
              //default: assume there is volume
              await createActivity({
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
                activity: {
                  timestamp: ts,
                  type: 'feed',
                  feed: {
                    type: formData.type,
                    duration: {
                      mins: formData.duration,
                    },
                  },
                },
              });
              break;
            }
          }

          router.back();
        }}
      />
    </Page>
  );
}
