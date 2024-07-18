import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { api } from '@workspace/backend/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { DateTime } from 'luxon';
import { useDeviceId } from '../../../src/hooks/useDeviceId';
import MedicalActivityForm, {
  MedicalActivityFormRef,
} from '../../../src/components/molecules/MedicalForm/MedicalForm';
import Page from '../../../src/components/organisms/Page';

export default function EditMedicalPage() {
  const p = useLocalSearchParams();
  const activityId = p['activityId'] as Id<'activities'>;
  const deviceId = useDeviceId();
  const activity = useQuery(api.activities.getById, { deviceId, activityId });
  const updateActivity = useMutation(api.activities.update);
  const deleteActivity = useMutation(api.activities.deleteActivity);
  const medicalFormRef = useRef<MedicalActivityFormRef>(null);

  useEffect(() => {
    if (activity?.activity.type === 'medical') {
      const medicalActivity = activity.activity.medical;
      if (medicalActivity.type === 'temperature') {
        medicalFormRef.current?.load({
          type: 'temperature',
          timestamp: DateTime.fromISO(activity.activity.timestamp),
          temperature: medicalActivity.temperature.value,
        });
      } else if (medicalActivity.type === 'medicine') {
        medicalFormRef.current?.load({
          type: 'medicine',
          timestamp: DateTime.fromISO(activity.activity.timestamp),
          name: medicalActivity.medicine.name,
          unit: medicalActivity.medicine.unit,
          value: medicalActivity.medicine.value,
        });
      }
    }
  }, [activity?.activity]);

  return (
    <Page title="Edit Medical">
      <View className="items-end mr-2 mb-4">
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
      <MedicalActivityForm
        mode="edit"
        ref={medicalFormRef}
        onSubmit={async (val) => {
          const ts = val.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + val.timestamp);
          switch (val.type) {
            case 'temperature': {
              await updateActivity({
                deviceId,
                activityId,
                activity: {
                  timestamp: ts,
                  type: 'medical',
                  medical: {
                    type: val.type,
                    temperature: {
                      value: val.temperature,
                    },
                  },
                },
              });
              break;
            }
            case 'medicine': {
              await updateActivity({
                deviceId,
                activityId,
                activity: {
                  timestamp: ts,
                  type: 'medical',
                  medical: {
                    type: val.type,
                    medicine: {
                      name: val.name,
                      unit: val.unit,
                      value: val.value,
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
