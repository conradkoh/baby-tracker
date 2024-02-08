import { Text } from 'react-native';
import Page from '../../components/organisms/Page';
import SelectPicker from '../../components/atoms/SelectPicker';
import { Branch } from '../../branch';
import { useBranch } from '../../storage/stores/branch';

export default function SettingsPage() {
  const { branch, setBranch } = useBranch();
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
    </Page>
  );
}
