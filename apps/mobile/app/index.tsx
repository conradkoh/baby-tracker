import { Text, View } from 'react-native';
import AppNav from '../src/components/organisms/AppNav';
import Page, { withPage } from '../src/components/organisms/Page';
import {} from '../src/providers/AppDataProvider';
import { api, useActivitiesPaginated } from '../src/services/api';
import { ActivityList } from '../src/components/molecules/ActivityList';
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { ActivityType } from '@workspace/backend/convex/activities';
import { timeAgo } from '../src/lib/time/timeAgo';
import { useCurrentDateTime } from '../src/lib/time/useCurrentDateTime';
import { router } from 'expo-router';
import { Loader } from '../src/components/molecules/Loader';
import { FeedType } from '@workspace/domain/entities/Feed';
import { Conditional } from '../src/components/atoms/Condition';
import { withReloadOnReconnect } from '../src/providers/ConvexClientProvider';
import { useDeviceId } from '../src/hooks/useDeviceId';
import ActivitySummary from '../src/components/molecules/ActivitySummary/ActivitySummary';

function AppIndexPage() {
  const fromTs = useMemo(() => {
    return DateTime.now().minus({ days: 7 }).startOf('day');
  }, []);
  const { results: activities, loadMore } = useActivitiesPaginated({ fromTs });
  const curDate = useCurrentDateTime();
  const lastFeedTimestamp = activities?.find(
    (v) =>
      v.activity.type === ActivityType.Feed &&
      DateTime.fromISO(v.activity.timestamp).toMillis() <= curDate.toMillis()
  )?.activity?.timestamp;
  const isLoading = activities == undefined;
  //get feed stats
  const feedStats = useMemo<{
    isLoading: boolean;
    isValid: boolean;
    threeHourlyVolume: number;
    twentyFourHourVolume: number;
  }>(() => {
    const feedStats = {
      isLoading: true,
      isValid: false, //always starts as false. as long as one data point is added, it is valid
      threeHourlyVolume: 0,
      twentyFourHourVolume: 0,
    };
    if (!activities) return feedStats; // activities not loaded

    //get feed activities
    const last24HrRange = { from: curDate.minus({ hours: 24 }), to: curDate };
    const last24HourFeedsWithVol: {
      activity: { dateTime: DateTime; feed: { volume: { ml: number } } };
    }[] = [];
    for (const f of activities) {
      if (
        f.activity.type === ActivityType.Feed &&
        f.activity.feed.type !== FeedType.Latch &&
        f.activity.feed.type !== FeedType.Solids &&
        DateTime.fromISO(f.activity.timestamp).toMillis() >
          last24HrRange.from.toMillis() &&
        DateTime.fromISO(f.activity.timestamp).toMillis() <=
          last24HrRange.to.toMillis()
      ) {
        last24HourFeedsWithVol.push({
          activity: {
            dateTime: DateTime.fromISO(f.activity.timestamp),
            feed: { volume: { ml: f.activity.feed.volume.ml } },
          },
        });
      }
    }

    //ensure at least 2 feeds
    if (last24HourFeedsWithVol.length < 2) {
      feedStats.isLoading = false;
      return feedStats;
    }
    const latest = last24HourFeedsWithVol.at(0);
    const earliest = last24HourFeedsWithVol.at(
      last24HourFeedsWithVol.length - 1
    );

    //type guards - should not happen due to array length check
    if (!latest) throw new Error('latest not defined');
    if (!earliest) throw new Error('earliest not defined');

    //compute stats
    const last24HrFeedStats = last24HourFeedsWithVol.reduce(
      (state, f) => {
        state.totalVol.ml += f.activity.feed.volume.ml;
        return state;
      },
      {
        totalVol: {
          ml: 0,
        },
      }
    );
    const totalDurationMins = latest.activity.dateTime
      .diff(earliest.activity.dateTime)
      .as('minutes');
    const minutelyVolume =
      (last24HrFeedStats.totalVol.ml - (latest.activity.feed.volume.ml || 0)) /
      totalDurationMins;
    feedStats.threeHourlyVolume = Math.ceil(minutelyVolume * 60 * 3); //2 decimal places, 3 hours
    feedStats.twentyFourHourVolume = last24HrFeedStats.totalVol.ml;
    feedStats.isLoading = false;
    feedStats.isValid = true;
    return feedStats;
  }, [activities, curDate]);
  const lastFeedTimeAgo = useMemo(() => {
    if (!lastFeedTimestamp) return undefined;
    return timeAgo({
      curDateTime: curDate,
      dateTime: DateTime.fromISO(lastFeedTimestamp),
    }).toString();
  }, [curDate, lastFeedTimestamp]);
  return (
    <Loader loading={isLoading}>
      <View style={{ minHeight: 2 }} className="grow">
        {lastFeedTimestamp ? (
          <View className=" bg-red-300 rounded-lg">
            <ActivitySummary
              lastFeed={`${lastFeedTimeAgo}`}
              feedVolume3HAvg={feedStats.threeHourlyVolume}
              feedVolume24HTotal={feedStats.twentyFourHourVolume}
            />
          </View>
        ) : null}
        <ActivityList
          onActivityPress={(a) => {
            switch (a.activity.activity.type) {
              case ActivityType.Feed: {
                router.push(`/feed/edit/${a.activity._id}`);
                break;
              }
              case ActivityType.DiaperChange: {
                router.push(`/diaper-change/edit/${a.activity._id}`);
                break;
              }
              case ActivityType.Medical: {
                router.push(`/medical/edit/${a.activity._id}`);
                break;
              }
              default: {
                break;
              }
            }
          }}
          activities={activities || []}
          loadMore={() => {
            loadMore(5);
          }}
        />
      </View>
    </Loader>
  );
}

export default withPage(
  { title: 'Baby Tracker' }, //this ensures that the reload only happens to the page contents, and does not affect the static content
  withReloadOnReconnect(AppIndexPage)
);
