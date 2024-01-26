import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, Text, View } from 'react-native';
import { api } from '@workspace/backend/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import ConvexClientProvider from '../ConvexClientProvider';
import Icon from 'react-native-vector-icons/FontAwesome';
import Button from '../components/atoms/Button';
import { BabyBottleIcon } from '../components/atoms/icons/BabyBottle';
import { DiaperChangeIcon } from '../components/atoms/icons/DiaperChange';
function App() {
  const activities = useQuery(api.activities.get);
  const count = useQuery(api.activities.count);
  const createActivity = useMutation(api.activities.create);
  const iconName = Platform.OS === 'ios' ? 'ios-search' : 'md-search';

  return (
    <View className="p-2">
      <Text className="text-xl font-bold mt-5">Baby Tracker</Text>
      <View>
        <View className="flex flex-row">
          <Button onPress={() => console.log('hi')}>
            <Icon name="rocket" size={30} />
          </Button>
          <Button onPress={() => console.log('hi')}>
            <BabyBottleIcon size={30} />
          </Button>
          <Button onPress={() => console.log('hi')}>
            <DiaperChangeIcon size={30} />
          </Button>
        </View>
      </View>
      <View className="p-4">
        <Text>{count + ' activities'}</Text>
        <Text>
          {activities === undefined
            ? 'loading...'
            : JSON.stringify(activities, null, 2)}
        </Text>
      </View>
      {/* <View className="flex-1 items-center mt-5 bg-white"> */}
      {/* </View> */}
      <StatusBar style="auto" />
    </View>
  );
}

function withConvex(Component) {
  return function Wrapper(props) {
    return (
      <ConvexClientProvider>
        <Component {...props} />
      </ConvexClientProvider>
    );
  };
}

export default withConvex(App);
