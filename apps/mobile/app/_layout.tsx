import { StatusBar } from 'expo-status-bar';
import { AppState, View } from 'react-native';
import ConvexClientProvider from '../ConvexClientProvider';
import { Slot } from 'expo-router';
import AppDataProvider from '../providers/AppDataProvider';
import { NativeWindStyleSheet } from 'nativewind';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { useEnv } from '../lib/env/useEnv';
import { useAppState } from '../lib/platform/useAppState';
export default function RootLayout() {
  const env = useEnv();
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
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
    <ConvexClientProvider>
      <AppDataProvider>
        <View>
          <Slot />
        </View>
      </AppDataProvider>
      <StatusBar style="auto" />
    </ConvexClientProvider>
  );
}

//Attempt to fix stale / caching issues in nativewind styles
NativeWindStyleSheet.setOutput({
  default: 'native',
});
