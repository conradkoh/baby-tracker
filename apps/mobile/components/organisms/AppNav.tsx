import { Pressable, Text, View } from 'react-native';
import { BabyBottleIcon } from '../atoms/icons/BabyBottle';
import { HomeIcon } from '../atoms/icons/Home';
import { Link } from 'expo-router';
import { router } from 'expo-router';
import Button from '../atoms/Button';
import { DiaperChangeIcon } from '../atoms/icons/DiaperChange';

export default function AppNav() {
  return (
    <>
      <View className="flex flex-row">
        <Button onPress={() => router.push('/')}>
          <HomeIcon size={30} />
        </Button>
        <Button onPress={() => router.push('/feed/create')}>
          <BabyBottleIcon size={30} />
        </Button>
        <Button onPress={() => router.push('/diaper-change/create')}>
          <DiaperChangeIcon size={30} />
        </Button>
      </View>
    </>
  );
}
