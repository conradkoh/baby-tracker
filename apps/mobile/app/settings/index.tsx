import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Page from '../../components/organisms/Page';
import SelectPicker from '../../components/atoms/SelectPicker';
import { Branch } from '../../branch';
import { useBranch } from '../../storage/stores/branch';
import { useEnv } from '../../lib/env/useEnv';
import PrimaryButton from '../../components/atoms/Button/Primary';
import { useDeviceInfo } from '../../providers/AppDataProvider';
import { useMutation } from 'convex/react';
import { api } from '../../services/api';
import { useQuery } from '../../lib/convex/use_query_swr';
import { toPascalCase } from '../../lib/string/string';
import { Conditional } from '../../components/atoms/Condition';
import { DeviceStatus } from '@workspace/backend/domain/entities/device/DeviceStatus';
import { useInputModal } from '../../components/atoms/AlertInputModal/AlertInputModal';

export default function SettingsPage() {
  const { branch, setBranch } = useBranch();
  const env = useEnv();
  const deviceInfo = useDeviceInfo();
  const createFamily = useMutation(api.family.create);
  const deleteFamily = useMutation(api.family.del);
  const approveJoinRequest = useMutation(api.family.approveJoinRequest);
  const family = useQuery(api.family.get, {
    familyId: deviceInfo.device?.familyId,
  });
  const InputModal = useInputModal();
  const isFamilyLoading = family === undefined;
  return (
    <Page title="Settings">
      <View className="p-2 grow ">
        <View className="pt-2">
          <Text>Env: {env.value}</Text>
          <Text>Device ID: {deviceInfo.device?.deviceId}</Text>
          <Text>Device Name: {deviceInfo.device?.deviceName}</Text>
        </View>
        <View className="pt-2">
          <Text>Branch</Text>
          <SelectPicker
            options={[
              { value: Branch.Dev, label: Branch.Dev },
              { value: Branch.Prod, label: Branch.Prod },
            ]}
            onChange={(v) => setBranch(v as Branch)}
            value={branch}
          />
        </View>
        {/* Family Management */}
        <View>
          <Text className="font-bold text-xl">Family</Text>
          <Conditional
            render={!isFamilyLoading}
            fallback={
              <View className="self-center">
                <Text>⏳</Text>
              </View>
            }
          >
            {family ? (
              <>
                <Text>Family ID: {family._id}</Text>
                <Text className="font-bold text-md py-2">Devices</Text>
                {family.devices.map((d) => (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        if (d.status === DeviceStatus.Pending) {
                          Alert.alert(
                            'Pending Device',
                            'Please confirm if this device belongs to your family.',
                            [
                              {
                                text: 'Deny',
                                onPress: () => {
                                  //TOOD: deny the request
                                },
                              },
                              {
                                text: 'Accept',
                                onPress: async () => {
                                  const device = deviceInfo.device;
                                  if (device) {
                                    await approveJoinRequest({
                                      deviceId: d.deviceId,
                                      authorizingDeviceId: device.deviceId,
                                      familyId: family._id,
                                    });
                                  } else {
                                    Alert.alert(
                                      'Approval Failed',
                                      'Unable to approve without device info.'
                                    );
                                  }
                                },
                              },
                            ]
                          );
                        }
                      }}
                    >
                      <View className="border border-blue-300 rounded-lg p-2">
                        <Text>Device ID: {d.deviceId}</Text>
                        <Text>Status: {toPascalCase(d.status)}</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ))}
                <PrimaryButton
                  className="my-2 w-1/2 bg-red-500"
                  title="Delete Family"
                  onPress={async () => {
                    const authorizingDevice = deviceInfo.device;
                    const familyId = authorizingDevice?.familyId;
                    if (authorizingDevice && familyId) {
                      Alert.alert('Delete Family', 'Are you sure?', [
                        {
                          text: 'Cancel',
                          onPress: () => {
                            //do nothing
                          },
                        },
                        {
                          text: 'Confirm',
                          onPress: async () => {
                            await deleteFamily({
                              authorizingDeviceId: authorizingDevice.deviceId,
                              familyId,
                            });
                          },
                        },
                      ]);
                    } else {
                      if (!familyId) {
                        Alert.alert(
                          'Delete Failed',
                          'No family ID is associated with this device.'
                        );
                      } else if (!authorizingDevice) {
                        Alert.alert(
                          'Delete Failed',
                          'The device has not been initialized.'
                        );
                      }
                    }
                  }}
                />
              </>
            ) : (
              <View>
                <Text>
                  This device has not yet been associated with a family.
                </Text>
                <View className="w-1/2 py-2">
                  <PrimaryButton
                    title="Create Family"
                    onPress={async () => {
                      const deviceId = deviceInfo.device?.deviceId;
                      if (deviceId) {
                        await createFamily({
                          deviceId,
                        });
                      } else {
                        Alert.alert(
                          'Unable to create family',
                          'This device does not have an ID, a family cannot be created.'
                        );
                      }
                    }}
                  />
                  <View className="p-2">
                    <Text className="text-center">Or</Text>
                  </View>
                  <PrimaryButton
                    title="Join Family"
                    onPress={async () => {
                      // const result = await InputModal.show(
                      //   'Join Family',
                      //   'Please enter the family ID:'
                      // );
                      // console.log('joining', result);
                    }}
                  />
                </View>
              </View>
            )}
          </Conditional>
        </View>
      </View>
      <View className="py-3 self-center w-1/2">
        <PrimaryButton
          className="bg-red-500"
          title="Reset Device"
          onPress={() => {
            Alert.alert('Reset', 'Reset all your data?', [
              {
                text: 'Cancel',
                onPress: () => {},
              },
              {
                text: 'Ok',
                onPress: () => {
                  deviceInfo.resetDevice();
                },
              },
            ]);
          }}
        />
      </View>
      {InputModal.element}
    </Page>
  );
}
