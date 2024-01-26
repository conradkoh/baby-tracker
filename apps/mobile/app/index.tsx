import { Platform, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import AppNav from '../components/organisms/AppNav';
import Page from '../components/organisms/Page';
import { useActivities } from '../providers/AppDataProvider';
import { api } from '../services/api';

function App() {
  const activities = useActivities();
  const count = useQuery(api.activities.count);
  const createActivity = useMutation(api.activities.create);
  const iconName = Platform.OS === 'ios' ? 'ios-search' : 'md-search';

  return (
    <Page title="Baby Tracker">
      <View className="p-4">
        <Text>{count + ' activities'}</Text>
        <Text>
          {activities === undefined
            ? 'loading...'
            : JSON.stringify(activities, null, 2)}
        </Text>
      </View>
    </Page>
  );
}
export default App;
