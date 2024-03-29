import { useMutation } from 'convex/react';
import { api } from '../../../src/services/api';
import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { ActivityType } from '@workspace/domain/entities/Activity';
import { DateTime } from 'luxon';

import { EditActivityPageLayout } from '../../../src/components/organisms/EditActivityPageLayout';
import {
  DiaperChangeForm,
  DiaperChangeFormRef,
} from '../../../src/components/molecules/DiaperChangeForm/DiaperChangeForm';
import { diaperChangeFromLiteral } from '@workspace/domain/entities/DiaperChange';
import { useQuery } from '../../../src/lib/convex/use_query_swr';
import { useDeviceId } from '../../../src/hooks/useDeviceId';
export default function EditDiaperChangePage() {
  const p = useLocalSearchParams();
  const activityId = p['activityId'] as Id<'activities'>;
  const deviceId = useDeviceId();
  const activity = useQuery(api.activities.getById, { deviceId, activityId });
  const updateActivity = useMutation(api.activities.update);
  const deleteActivity = useMutation(api.activities.deleteActivity);
  const diaperChangeFormRef = useRef<DiaperChangeFormRef>(null);
  useEffect(() => {
    if (activity?.activity.type === ActivityType.DiaperChange) {
      const diaperChange = activity.activity.diaperChange;
      if (!diaperChange) {
        alert('failed to load - diaper change data not found.');
        return;
      }
      diaperChangeFormRef.current?.load({
        type: diaperChangeFromLiteral(diaperChange.type),
        timestamp: DateTime.fromISO(activity.activity.timestamp),
      });
    }
  }, [activity?.activity]);
  return (
    <EditActivityPageLayout
      title="Edit Feed"
      onDeletePress={() => {
        deleteActivity({ activityId });
        router.back();
      }}
    >
      <DiaperChangeForm
        mode="edit"
        ref={diaperChangeFormRef}
        onSubmit={async function (formData): Promise<void> {
          const ts = formData.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + formData.timestamp);
          await updateActivity({
            deviceId,
            activityId,
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
      />
    </EditActivityPageLayout>
  );
}
