import { ScrollView, Text, View } from 'react-native';
import AppNav from './AppNav';
import { createContext, useContext, useState } from 'react';

export default function Page(props: { title: string; children: any }) {
  const [bottomEl, setBottomEl] = useState<any>(null);
  return (
    <pageContext.Provider
      value={{
        setBottomEl: (el) => {
          setBottomEl(el);
        },
        reset: () => setBottomEl(null),
      }}
    >
      <View className="p-2 flex-1 bg-red-500 min-h-screen">
        <View className="h-30">
          <Text className="mt-4 text-3xl font-bold">{props.title}</Text>
          <View className="my-2">
            <AppNav />
          </View>
        </View>
        <View className="flex-1 bg-gray-100">
          <ScrollView>
            <View>{props.children}</View>
          </ScrollView>
        </View>
        {bottomEl ? <View className="h-18 py-4">{bottomEl}</View> : null}
      </View>
    </pageContext.Provider>
  );
}

const pageContext = createContext<{
  setBottomEl: (v) => void;
  reset: () => void;
}>({
  setBottomEl: (v) => {
    throw new Error('failed to get page context before calling setBottomEl');
  },
  reset: () => {
    throw new Error('failed to get page context before calling reset');
  },
});

export function usePage() {
  const ctx = useContext(pageContext);
  return ctx;
}
