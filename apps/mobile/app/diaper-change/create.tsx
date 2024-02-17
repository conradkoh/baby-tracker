import Page from '../../components/organisms/Page';
import { DiaperChangeForm } from '../../components/molecules/DiaperChangeForm/DiaperChangeForm';
import { useMutation } from 'convex/react';
import { api } from '../../services/api';
import { router } from 'expo-router';

export default function DiaperChangeCreatePage() {
  const createActivity = useMutation(api.activities.create);
  return (
    <Page title="Diaper Change">
      <DiaperChangeForm
        onSubmit={async (formData) => {
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
        }}
        mode="create"
      />
    </Page>
  );
}
