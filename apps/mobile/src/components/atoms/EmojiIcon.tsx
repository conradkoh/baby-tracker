import { Text, View } from 'react-native';
export function EmojiIcon({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex items-center justify-center border border-slate-300 bg-slate-200 shadow-lg aspect-square rounded-xl p-4">
      <Text>{children}</Text>
    </View>
  );
}
