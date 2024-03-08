import Page from '../../src/components/organisms/Page';
import { DiaperChangeForm } from '../../src/components/molecules/DiaperChangeForm/DiaperChangeForm';
import { useMutation } from 'convex/react';
import { api } from '../../src/services/api';
import { router } from 'expo-router';
import { requestAllowFutureDate } from '../../src/lib/time/requestAllowFutureDate';

export default function DiaperChangeCreatePage() {
  const createActivity = useMutation(api.activities.create);
  return (
    <Page title="Diaper Change">
      <DiaperChangeForm
        onSubmit={async (formData) => {
          let allowCreate = true;
          if (formData.timestamp.toMillis() > Date.now()) {
            allowCreate = await requestAllowFutureDate();
          }
          if (allowCreate) {
            const ts = formData.timestamp.toISO();
            if (ts === null)
              throw new Error('invalid timestamp: ' + formData.timestamp);
            await createActivity({
              activity: {
                timestamp: ts,
                type: 'diaper_change',
                diaperChange: {
                  type: formData.type,
                },
              },
            });
            router.back();
          }
        }}
        mode="create"
      />
    </Page>
  );
}
