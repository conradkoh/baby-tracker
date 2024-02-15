import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import {
  ConnectionStatus,
  withConvex,
} from '../providers/ConvexClientProvider';
import { Slot } from 'expo-router';
import AppDataProvider from '../providers/AppDataProvider';
import { NativeWindStyleSheet } from 'nativewind';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { useEnv } from '../lib/env/useEnv';
import { useAppState } from '../lib/platform/useAppState';
import { SafeAreaView } from 'react-native';
function RootLayout() {
  const env = useEnv();
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'Would you like to reload the app?',
          [
            {
              text: 'Cancel',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      alert(`Error fetching latest Expo update: ${error}`);
    }
  }
  const appState = useAppState();
  useEffect(() => {
    if (appState.didFocus()) {
      console.log('checking for updates...');
      onFetchUpdateAsync();
    }
  }, [appState]);

  return (
    <>
      <View className="min-h-screen flex-1">
        <ConnectionStatus />
        <SafeAreaView className="bg-blue-200 grow">
          <AppDataProvider>
            <View className="grow">
              <Slot />
            </View>
          </AppDataProvider>
          <StatusBar style="auto" />
        </SafeAreaView>
      </View>
    </>
  );
}

//Attempt to fix stale / caching issues in nativewind styles
NativeWindStyleSheet.setOutput({
  default: 'native',
});
export default withConvex(RootLayout);
