import { Alert, Text, Touchable, TouchableOpacity, View } from 'react-native';
import Page from '../../src/components/organisms/Page';
import SelectPicker from '../../src/components/atoms/SelectPicker';
import { Branch } from '../../branch';
import { useBranch } from '../../src/storage/stores/branch';
import { useEnv } from '../../src/lib/env/useEnv';
import PrimaryButton from '../../src/components/atoms/Button/Primary';
import { useDeviceInfo } from '../../src/providers/AppDataProvider';
import { useMutation } from 'convex/react';
import { api } from '../../src/services/api';
import { toPascalCase } from '../../src/lib/string/string';
import { Conditional } from '../../src/components/atoms/Condition';
import { DeviceStatus } from '@workspace/backend/domain/entities/device/DeviceStatus';
import { useInputModal } from '../../src/components/atoms/AlertInputModal/AlertInputModal';
import CopyIcon from '../../src/components/atoms/CopyIcon/CopyIcon';
import { useQuery } from '../../src/lib/convex/use_query_swr';
import * as Clipboard from 'expo-clipboard';
import { ConvexError } from 'convex/values';
export default function SettingsPage() {
  const { branch, setBranch } = useBranch();
  const env = useEnv();
  const deviceInfo = useDeviceInfo();
  const createFamily = useMutation(api.family.create);
  const deleteFamily = useMutation(api.family.del);
  const approveJoinRequest = useMutation(api.family.approveJoinRequest);
  const createJoinRequest = useMutation(api.family.requestJoin);
  const family = useQuery(api.family.get, {
    familyId: deviceInfo.device?.familyId,
  });
  const deviceFamilyJoinRequests = useQuery(api.device.getFamilyJoinRequests, {
    deviceId: deviceInfo.device?.deviceId,
  });
  const InputModal = useInputModal();
  const isFamilyLoading = family === undefined;
  const deviceId = deviceInfo.device?.deviceId;
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
                <View className="flex-row items-center">
                  <Text>Family ID:</Text>
                  <TouchableOpacity
                    onPress={() => Clipboard.setStringAsync(family._id)}
                  >
                    <View className="flex-row items-center">
                      <Text className="mr-1">{family._id}</Text>
                      <Text>
                        <CopyIcon />
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <Text className="font-bold text-md py-2">Devices</Text>
                <Conditional render={family.joinRequests.length === 0}>
                  <Text>There are no join requests. </Text>
                </Conditional>
                {family.joinRequests.map((d) => (
                  <TouchableOpacity
                    key={d.deviceId}
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
              <>
                <Conditional
                  render={
                    !!(
                      deviceFamilyJoinRequests?.length &&
                      deviceFamilyJoinRequests[0]?.status ===
                        DeviceStatus.Pending
                    )
                  }
                >
                  <View>
                    <Text>Your family join request is pending.</Text>
                  </View>
                </Conditional>
                <Conditional render={deviceFamilyJoinRequests?.length === 0}>
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
                          await InputModal.show('Request to Join Family', {
                            placeholder: 'Family ID',
                            onSubmit: async (result) => {
                              console.log('attempting to submit');
                              if (deviceId) {
                                try {
                                  const joinRequest = await createJoinRequest({
                                    deviceId,
                                    familyId: result,
                                  });
                                  if (joinRequest.isError) {
                                    Alert.alert(
                                      `Error: ${joinRequest.message}`
                                    );
                                  } else {
                                    Alert.alert(joinRequest.message);
                                    InputModal.close();
                                  }
                                } catch (err: unknown) {
                                  if (err instanceof ConvexError) {
                                    const { message } = err.data as {
                                      message: string;
                                    };
                                    Alert.alert(
                                      `Error: Failed to create join request.`
                                    );
                                  }
                                  throw err;
                                }
                              } else {
                                Alert.alert(
                                  'This device has no ID. Please try to restart the app.'
                                );
                              }
                            },
                          });
                        }}
                      />
                    </View>
                  </View>
                </Conditional>
              </>
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
