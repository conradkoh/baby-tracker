import { FlashList } from '@shopify/flash-list';
import { Activity, ActivityType } from '@workspace/backend/convex/activities';
import { Text, TouchableOpacity, View } from 'react-native';
import { DateTime, Duration } from 'luxon';
import { useCurrentDateTime } from '../../../lib/time/useCurrentDateTime';
import { formatTime } from '../../../lib/time/format';
import { FeedType } from '@workspace/domain/entities/Feed';
import { Conditional } from '../../atoms/Condition';
import { FC, useMemo } from 'react';
import {
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
  const { mainContent, subContent } = useMemo(() => {
    let mainContent = '';
    let subContent = '';
    switch (activity.activity.type) {
      case ActivityType.Feed: {
        const feed = activity.activity.feed;
        mainContent = `${toPascalCase(feed.type)}`;
        switch (feed.type) {
          case FeedType.Latch: {
            const duration = Duration.fromObject({
              seconds:
                (feed.duration.left?.seconds || 0) +
                (feed.duration.right?.seconds || 0),
            });

            subContent =
              duration.normalize().toFormat('m') == '1'
                ? `${duration.toFormat("m 'min'")}`
                : `${duration.toFormat("m 'mins'")}`;
            break;
          }
          case FeedType.Expressed:
          case FeedType.Formula: {
            subContent = `${feed.volume.ml} ml`;
            break;
          }
        }
        break;
      }
      case ActivityType.DiaperChange: {
        const diaperChange = activity.activity.diaperChange;
        mainContent = `${toPascalCase(diaperChange.type)}`;
        break;
      }
    }
    return { mainContent, subContent };
  }, [activity.activity]);
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
                <Text>{mainContent}</Text>
              </View>
            </View>
            {/* Sub Content */}
            <View className="align-middle justify-center pr-2 ">
              <Conditional render={!!subContent}>
                <SubInfo>
                  <Text className="text-xs">{subContent}</Text>
                </SubInfo>
              </Conditional>
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
