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
  loadMore: () => void;
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
        onEndReached={props.loadMore}
        onEndReachedThreshold={0.5}
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
  let icon = <></>;
  switch (activity.activity.type) {
    case ActivityType.Feed: {
      icon = <Text>🍼</Text>;
      if (activity.activity.feed.type === FeedType.Water) {
        icon = <Text>💧</Text>;
      }
      break;
    }
    case ActivityType.DiaperChange: {
      icon = <Text>💩</Text>;
      break;
    }
    case ActivityType.Medical: {
      icon = <Text>💊</Text>;
      if (activity.activity.medical.type === 'temperature') {
        icon = <Text>🌡️</Text>;
      }
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
          case FeedType.Water:
          case FeedType.Expressed:
          case FeedType.Formula: {
            subContent = `${feed.volume.ml} ml`;
            break;
          }
          case FeedType.Solids: {
            subContent = feed.description;
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
      case ActivityType.Medical: {
        const medical = activity.activity.medical;
        switch (medical.type) {
          case 'temperature': {
            mainContent = `Temperature`;
            subContent = `${medical.temperature.value} °C`;
            break;
          }
          case 'medicine': {
            mainContent = `${medical.medicine.name}`;
            subContent = `${medical.medicine.value} ${medical.medicine.unit}`;
            break;
          }
        }
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
            <View>
              <View className="flex-1 w-24 align-middle justify-center">
                <Text>{mainContent}</Text>
              </View>
            </View>
            {/* Sub Content */}
            <View className="grow items-start justify-center px-2">
              <Conditional render={!!subContent}>
                <SubInfo>
                  <Text className="text-xs">{subContent}</Text>
                </SubInfo>
              </Conditional>
            </View>
            {/* Time Info */}
            <View className="align-middle justify-center pr-3">
              <Text className="flex-wrap text-xs">
                {formatTime(activityTimestamp)}
              </Text>
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
