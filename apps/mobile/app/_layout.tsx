import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import ConvexClientProvider from '../ConvexClientProvider';
import { Slot } from 'expo-router';
import AppDataProvider from '../providers/AppDataProvider';
export default function RootLayout() {
  return (
    <ConvexClientProvider>
      <AppDataProvider>
        <View className="mt-4">
          <Slot />
        </View>
      </AppDataProvider>
      <StatusBar style="auto" />
    </ConvexClientProvider>
  );
}
