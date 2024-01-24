import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import ConvexClientProvider from './ConvexClientProvider';
function App() {
  const activities = useQuery(api.activities.get);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Open up App.js to start working on your app!</Text>
      <Text>
        {activities === undefined
          ? 'loading...'
          : JSON.stringify(activities, null, 2)}
      </Text>
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
