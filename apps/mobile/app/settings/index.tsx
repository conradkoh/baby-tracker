import { Alert, Text, View } from 'react-native';
import Page from '../../components/organisms/Page';
import SelectPicker from '../../components/atoms/SelectPicker';
import { Branch } from '../../branch';
import { useBranch } from '../../storage/stores/branch';
import { useEnv } from '../../lib/env/useEnv';
import { useDeviceInfo } from '../../providers/AppDataProvider';
import PrimaryButton from '../../components/atoms/Button/Primary';

export default function SettingsPage() {
  const { branch, setBranch } = useBranch();
  const env = useEnv();
  const deviceInfo = useDeviceInfo();
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
    </Page>
  );
}
