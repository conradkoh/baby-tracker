import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import ConvexClientProvider from '../ConvexClientProvider';
import { Slot } from 'expo-router';
import AppDataProvider from '../providers/AppDataProvider';
import { NativeWindStyleSheet } from 'nativewind';
export default function RootLayout() {
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
