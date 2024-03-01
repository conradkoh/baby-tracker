import { StyleSheet, View } from 'react-native';
import { BabyBottleIcon } from '../atoms/icons/BabyBottle';
import { HomeIcon } from '../atoms/icons/Home';
import { router } from 'expo-router';
import IconButton from '../atoms/Button/Icon';
import { DiaperChangeIcon } from '../atoms/icons/DiaperChange';
import { SettingsIcon } from '../atoms/icons/Settings';

export default function AppNav() {
  return (
    <>
      <View className="flex flex-row space-x-3">
        <IconButton onPress={() => router.push('/')}>
          <HomeIcon />
        </IconButton>
        <IconButton onPress={() => router.push('/feed/create')}>
          <BabyBottleIcon />
        </IconButton>
        <IconButton onPress={() => router.push('/diaper-change/create')}>
          <DiaperChangeIcon />
        </IconButton>
        <IconButton onPress={() => router.push('/settings')}>
          <SettingsIcon />
        </IconButton>
      </View>
    </>
  );
}
