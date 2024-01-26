import { Text, View } from 'react-native';
import AppNav from './AppNav';

export default function Page(props: { title: string; children: any }) {
  return (
    <View className="m-2">
      <Text className="text-3xl font-bold">{props.title}</Text>
      <AppNav />
      {props.children}
    </View>
  );
}
