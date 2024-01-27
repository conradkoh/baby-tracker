import { View, Text } from 'react-native';
import AppNav from '../../components/organisms/AppNav';
import Page, { usePage } from '../../components/organisms/Page';
import PrimaryButton from '../../components/atoms/Button/Primary';
import { useEffect } from 'react';

export default function CreateFeedPage() {
  return (
    <Page title="Create Feed">
      <Text>Hello</Text>
      <CreateFeedButton />
    </Page>
  );
}
/**
 * Attaches the create feed button to the page
 * @returns
 */
function CreateFeedButton() {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(<PrimaryButton onPress={() => {}} title="Save" />);
    return () => page.reset();
  }, []);
  return <></>;
}
