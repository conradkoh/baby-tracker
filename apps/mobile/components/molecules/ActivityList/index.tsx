import { FlashList } from '@shopify/flash-list';
import { Activity, ActivityType } from '@workspace/backend/convex/activities';
import { Text, TouchableOpacity, View } from 'react-native';
import { DateTime, Duration } from 'luxon';
import { timeAgo } from '../../../lib/time/timeAgo';
import { useCurrentDateTime } from '../../../lib/time/useCurrentDateTime';
import { formatDateTime, formatTime } from '../../../lib/time/format';
import { FeedType } from '@workspace/domain/entities/Feed';
import { Conditional } from '../../atoms/Condition';
import { FC, useMemo } from 'react';
import {
  ActivityListViewableItem,
  ActivityListViewableItemType,
  viewModelFromActivities,
} from './ActivityListViewModel';
import { toPascalCase } from '../../../lib/string/string';

interface ActivityListProps {
  activities: Activity[];
  onActivityPress: (e: { activity: Activity }) => void;
}

export function ActivityList(props: ActivityListProps) {
  const listItems = useMemo(
    () => viewModelFromActivities(props.activities),
    [props.activities]
  );
  return (
    <View className="grow">
      <FlashList
        className="grow"
        data={listItems}
        renderItem={(val) => {
          if (val.item.type === ActivityListViewableItemType.Section) {
            return (
              <View className="py-1 px-2 border border-blue-300 bg-blue-300 shadow-xl">
                <Text className="font-semibold">{val.item.section.title}</Text>
              </View>
            );
          }
          return (
            <ActivityItem
              activity={val.item.activity}
              onPress={props.onActivityPress}
            />
          );
        }}
        estimatedItemSize={200}
      />
    </View>
  );
}

function ActivityItem(props: {
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
        <View className="flex-col grow">
          <View className="flex-row grow">
            {/* Content next to the icon */}
            <View className="flex-1">
              <View className="flex-1 align-middle justify-center">
                <Conditional
                  render={activity.activity.type === ActivityType.Feed}
                >
                  <FeedDetails activity={activity} />
                </Conditional>
                <Conditional
                  render={activity.activity.type === ActivityType.DiaperChange}
                >
                  <DiaperChangeDetails activity={activity} />
                </Conditional>
              </View>
            </View>
            {/* Time Info */}
            <View className="align-middle justify-center pr-2 ">
              <Text className="flex-wrap">{formatTime(activityTimestamp)}</Text>
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
  let mainContent = '';
  let subContent = '';
  if (activity.activity.type === ActivityType.Feed && activity.activity.feed) {
    const feed = activity.activity.feed;
    mainContent = `${toPascalCase(feed.type)}`;
    switch (feed.type) {
      case FeedType.Latch: {
        const duration = Duration.fromObject({
          seconds:
            (feed.duration.left?.seconds || 0) +
            (feed.duration.right?.seconds || 0),
        });
        subContent = `${duration.toFormat("m 'mins'")}`;
        break;
      }
      case FeedType.Expressed:
      case FeedType.Formula: {
        subContent = `${feed.volume.ml} ml`;
        break;
      }
    }
  }
  return (
    <View className="flex-row align-middle items-center">
      <View>
        <Text style={props.style}>{`${mainContent}`}</Text>
      </View>
      <View className="mx-2">
        <SubInfo>
          <Text className="text-xs">{subContent}</Text>
        </SubInfo>
      </View>
    </View>
  );

  return <></>;
}

function DiaperChangeDetails(props: { activity: Activity }) {
  const { activity } = props;
  if (
    activity.activity.type === ActivityType.DiaperChange &&
    activity.activity.diaperChange
  ) {
    const diaperChange = activity.activity.diaperChange;

    return <Text>{`${toPascalCase(diaperChange.type)}`}</Text>;
  }
  return <></>;
}

const SubInfo: FC<{
  children: React.ReactNode;
}> = (props) => {
  return (
    <View
      style={{ paddingHorizontal: 6, paddingVertical: 2 }}
      className="bg-blue-300 rounded-lg items-center"
    >
      {props.children}
    </View>
  );
};
