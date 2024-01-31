import { View } from 'react-native';
import { Item } from './Item';

export function SelectButtons(p: {
  options: {
    value: any;
    title: string;
  }[];
  onChange: (newVal: any) => void;
  value: any;
}) {
  return (
    <View className="flex-row space-x-2">
      {p.options.map((o) => (
        <Item
          selected={p.value === o.value}
          onPress={() => p.onChange(o.value)}
          title={o.title}
        />
      ))}
    </View>
  );
}
