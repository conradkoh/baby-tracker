import { FlashList } from '@shopify/flash-list';
import { Activity, ActivityType } from '@workspace/backend/convex/activities';
import { Text, TouchableOpacity, View } from 'react-native';
import { DateTime } from 'luxon';
import { Format, timeAgo } from '../../../lib/time/timeAgo';
import { useCurrentDateTime } from '../../../lib/time/useCurrentDateTime';
import { formatDateTime } from '../../../lib/time/format';
import { FeedType } from '@workspace/domain/entities/Feed';

interface ActivityListProps {
  activities: Activity[];
  onActivityPress: (e: { activity: Activity }) => void;
}

export function ActivityList(props: ActivityListProps) {
  return (
    <View className="w-full h-full">
      <FlashList
        className="w-full h-full"
        data={props.activities}
        renderItem={(val) => {
          return (
            <ActivityListItem
              activity={val.item}
              onPress={props.onActivityPress}
            />
          );
        }}
        estimatedItemSize={200}
      />
    </View>
  );
}

function ActivityListItem(props: {
  activity: Activity;
  onPress: (e: { activity: Activity }) => void;
}) {
  const activity = props.activity;
  const activityTimestamp = DateTime.fromISO(activity.activity.timestamp);
  const curDateTime = useCurrentDateTime();
  let icon = <></>;
  switch (activity.activity.type) {
    case ActivityType.Feed: {
      icon = <Text>🍼</Text>;
      break;
    }
    case ActivityType.DiaperChange: {
      icon = <Text>💩</Text>;
      break;
    }
    default: {
      icon = <Text>❓</Text>;
      break;
    }
  }
  return (
    <TouchableOpacity
      onPress={() => props.onPress({ activity: props.activity })}
    >
      <View className="flex-row py-2 px-1 my-1 border bg-blue-300 border-blue-400 rounded-lg">
        {/* Icon container with fixed size */}
        <View className="h-100 p-2 rounded-2xl flex items-center justify-center">
          {icon}
        </View>
        {/* Content next to the icon */}
        <View style={{ flex: 1, backgroundColor: 'red-50', paddingLeft: 8 }}>
          <FeedDetails activity={activity} />
          <View>
            <Text className="flex-wrap">
              {formatDateTime(activityTimestamp)} (
              {timeAgo({
                curDateTime,
                dateTime: activityTimestamp,
                format: Format.HoursAndMinutes,
              })}
              )
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FeedDetails(props: {
  className?: string;
  style?: any;
  activity: Activity;
}) {
  const { activity } = props;
  if (activity.activity.type === ActivityType.Feed && activity.activity.feed) {
    const feed = activity.activity.feed;
    if (feed.type === FeedType.Latch) {
      return (
        <Text
          style={props.style}
        >{`${feed.type} ${feed.duration.mins} mins`}</Text>
      );
    }
    return (
      <Text style={props.style}>{`${feed.type} ${feed.volume.ml} ml`}</Text>
    );
  }
  return <></>;
}
