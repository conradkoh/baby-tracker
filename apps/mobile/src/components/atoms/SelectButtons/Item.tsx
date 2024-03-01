import { Pressable, PressableProps, Text, View } from 'react-native';
export function Item({
  selected = false,
  onPress,
  title,
  style,
}: {
  selected: boolean;
  style?: any;
  onPress: Pick<PressableProps, 'onPress'>['onPress'];
  title: string;
}) {
  return (
    <Pressable
      style={style}
      className={`bg-blue-200 border-blue-400 border
      text-center items-center py-3 px-5 rounded`}
      onPress={onPress}
    >
      <Text className="text-black">{title}</Text>
    </Pressable>
  );
}
