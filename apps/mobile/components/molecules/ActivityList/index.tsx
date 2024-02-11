import { FlashList } from '@shopify/flash-list';
import { Activity, ActivityType } from '@workspace/backend/convex/activities';
import { Text, TouchableOpacity, View } from 'react-native';
import { DateTime, Duration } from 'luxon';
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
    <View className="grow">
      <FlashList
        className="grow"
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
      <View className="flex-row">
        {/* Icon container with fixed size */}
        <View className="h-100 p-1 flex items-center justify-center">
          <View className="h-100 m-1 p-2 rounded-2xl flex items-center justify-center bg-blue-300">
            {icon}
          </View>
        </View>
        {/* Content next to the icon */}
        <View className="flex-1">
          <View className="flex-1 align-middle justify-center">
            <FeedDetails activity={activity} />
            <View>
              <Text className="flex-wrap">
                {formatDateTime(activityTimestamp)} (
                {timeAgo({
                  curDateTime,
                  dateTime: activityTimestamp,
                })}
                )
              </Text>
            </View>
          </View>
          <View className="border-b border-blue-300" />
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
      const duration = Duration.fromObject({
        seconds:
          (feed.duration.left?.seconds || 0) +
          (feed.duration.right?.seconds || 0),
      });
      return (
        <Text style={props.style}>{`${feed.type} ${duration.toFormat(
          "m 'minutes' s 'seconds'"
        )}`}</Text>
      );
    }
    return (
      <Text style={props.style}>{`${feed.type} ${feed.volume.ml} ml`}</Text>
    );
  }
  return <></>;
}
