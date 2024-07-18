import Page from '../../src/components/organisms/Page';
import MedicalActivityForm from '../../src/components/molecules/MedicalForm/MedicalForm';
import { api } from '@workspace/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useDeviceId } from '../../src/hooks/useDeviceId';

export default function CreateMedicalPage() {
  const deviceId = useDeviceId();
  const createActivity = useMutation(api.activities.create);
  return (
    <Page title="Create Medical">
      <MedicalActivityForm
        mode="create"
        onSubmit={async (val) => {
          const ts = val.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + val.timestamp);
          switch (val.type) {
            case 'temperature': {
              await createActivity({
                deviceId,
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
              await createActivity({
                deviceId,
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
        }}
      />
    </Page>
  );
}
