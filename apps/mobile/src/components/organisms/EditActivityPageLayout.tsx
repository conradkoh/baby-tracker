import { View, Text, TouchableOpacity } from 'react-native';
import Page from './Page';

export interface EditActivityPageLayout {
  title: string;
  onDeletePress: () => Promise<void> | void;
  children: React.ReactNode;
}
export function EditActivityPageLayout(props: EditActivityPageLayout) {
  return (
    <Page title={props.title}>
      <View className="items-end mr-2">
        <TouchableOpacity
          className="bg-red-300 p-2 rounded"
          onPress={async () => {
            await props.onDeletePress();
          }}
        >
          <Text className="text-red-800">DELETE</Text>
        </TouchableOpacity>
      </View>
      {props.children}
    </Page>
  );
}
