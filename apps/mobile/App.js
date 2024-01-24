import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import ConvexClientProvider from './ConvexClientProvider';
function App() {
  const activities = useQuery(api.activities.get);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>{JSON.stringify(activities, null, 2)}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
