import { Platform, Text, View } from 'react-native';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import AppNav from '../components/organisms/AppNav';
import Page, { withPage } from '../components/organisms/Page';
import { useActivities } from '../providers/AppDataProvider';
import { api } from '../services/api';
import { ActivityList } from '../components/molecules/ActivityList';
import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { ActivityType } from '@workspace/backend/convex/activities';
import { Format, timeAgo } from '../lib/time/timeAgo';
import { useCurrentDateTime } from '../lib/time/useCurrentDateTime';
import { router } from 'expo-router';
import { Loader } from '../components/molecules/Loader';
import { FeedType } from '@workspace/domain/entities/Feed';
import { Conditional } from '../components/atoms/Condition';
import { withReloadOnReconnect } from '../providers/ConvexClientProvider';

function AppIndexPage() {
  const [tsRange, setTsRange] = useState<{ fromTs: string; toTs: string }>(
    defaultDateRange()
  );
  const {
    results: activities,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.activities.getByTimestampDescPaginated,
    {
      fromTs: tsRange.fromTs,
    },
    { initialNumItems: 10 }
  );
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
  }>(() => {
    const feedStats = {
      isLoading: true,
      isValid: false,
      threeHourlyVolume: -1,
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
    const minutelyVolume = last24HrFeedStats.totalVol.ml / totalDurationMins;
    feedStats.threeHourlyVolume = Math.ceil(minutelyVolume * 60 * 3); //2 decimal places, 3 hours
    feedStats.isLoading = false;
    feedStats.isValid = true;
    return feedStats;
  }, [activities, curDate]);
  return (
    <Loader loading={isLoading}>
      <View style={{ minHeight: 2 }} className="grow">
        {lastFeedTimestamp ? (
          <View className="border p-4 border-red-200 bg-red-300 rounded-lg">
            <Text>
              Last Feed:{' '}
              {timeAgo({
                curDateTime: curDate,
                dateTime: DateTime.fromISO(lastFeedTimestamp),
              })}
            </Text>
            <Conditional render={!feedStats.isLoading}>
              <Text>
                Feed volume:{' '}
                {feedStats.isValid
                  ? `${feedStats.threeHourlyVolume} ml`
                  : 'insufficient data'}
              </Text>
            </Conditional>
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
              default: {
                break;
              }
            }
          }}
          activities={activities || []}
          loadMore={() => {
            loadMore(7);
          }}
        />
      </View>
    </Loader>
  );
}

function defaultDateRange() {
  const curDate = DateTime.now();
  return {
    fromTs: curDate.minus({ days: 7 }).toUTC().toISO(),
    toTs: curDate.toUTC().toISO(),
  };
}
export default withPage(
  { title: 'Baby Tracker' }, //this ensures that the reload only happens to the page contents, and does not affect the static content
  withReloadOnReconnect(AppIndexPage)
);
