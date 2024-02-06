import { FlashList } from '@shopify/flash-list';
import { Activity, ActivityType } from '@workspace/backend/convex/activities';
import { Text, View } from 'react-native';
import { BabyBottleIcon } from '../../atoms/icons/BabyBottle';
import { DateTime } from 'luxon';
import { useEffect, useRef, useState } from 'react';
import { Format, timeAgo } from '../../../lib/time/timeAgo';
import { useCurrentDateTime } from '../../../lib/time/useCurrentDateTime';
import { formatDateTime } from '../../../lib/time/format';

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList(props: ActivityListProps) {
  return (
    <FlashList
      className="w-full h-full"
      data={props.activities}
      renderItem={(val) => {
        return <ActivityListItem activity={val.item} />;
      }}
      estimatedItemSize={200}
    />
  );
}

function ActivityListItem(props: { activity: Activity }) {
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
    return (
      <Text style={props.style}>{`${feed.type} ${feed.volume.ml} ml`}</Text>
    );
  }
  return <></>;
}
