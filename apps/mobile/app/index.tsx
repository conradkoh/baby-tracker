import { Platform, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import AppNav from '../components/organisms/AppNav';
import Page from '../components/organisms/Page';
import { useActivities } from '../providers/AppDataProvider';
import { api } from '../services/api';
import { ActivityList } from '../components/molecules/ActivityList';

function App() {
  const activities = useActivities();
  const count = useQuery(api.activities.count);
  const createActivity = useMutation(api.activities.create);
  const iconName = Platform.OS === 'ios' ? 'ios-search' : 'md-search';

  return (
    <Page title="Baby Tracker">
      <View className="p-4">
        <Text>{count + ' activities'}</Text>
        <View style={{ minHeight: 2 }} className="flex-1 w-full h-full">
          <ActivityList activities={activities || []} />
        </View>
      </View>
    </Page>
  );
}
export default App;
