import { Text } from 'react-native';
import Page from '../../components/organisms/Page';
import SelectPicker from '../../components/atoms/SelectPicker';
import { Branch } from '../../branch';
import { useBranch } from '../../storage/stores/branch';
import { useEnv } from '../../lib/env/useEnv';

export default function SettingsPage() {
  const { branch, setBranch } = useBranch();
  const env = useEnv();
  return (
    <Page title="Settings">
      <Text>Branch</Text>
      <SelectPicker
        options={[
          { value: Branch.Dev, label: Branch.Dev },
          { value: Branch.Prod, label: Branch.Prod },
        ]}
        onChange={(v) => setBranch(v as Branch)}
        value={branch}
      />
      <Text>Env: {env.value}</Text>
    </Page>
  );
}
