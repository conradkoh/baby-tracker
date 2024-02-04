import { FlashList } from '@shopify/flash-list';
import { Text } from 'react-native';

interface ActivityListProps {
  activities: {
    activity: {
      type: string;
    };
  }[];
}

export function ActivityList(props: ActivityListProps) {
  return (
    <FlashList
      className="w-full h-full"
      data={props.activities}
      renderItem={(val) => {
        return <Text className="p-2">{val.item.activity.type}</Text>;
      }}
      estimatedItemSize={200}
    />
  );
}
