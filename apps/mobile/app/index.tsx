import { Platform, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import AppNav from '../components/organisms/AppNav';
import Page from '../components/organisms/Page';
import { useActivities } from '../providers/AppDataProvider';
import { api } from '../services/api';
import { ActivityList } from '../components/molecules/ActivityList';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { ActivityType } from '@workspace/backend/convex/activities';
import { Format, timeAgo } from '../lib/time/timeAgo';
import { useCurrentDateTime } from '../lib/time/useCurrentDateTime';

function App() {
  const [tsRange, setTsRange] = useState<{ fromTs: string; toTs: string }>(
    defaultDateRange()
  );
  console.log({ tsRange });
  const activities = useQuery(api.activities.getByTimestampDesc, tsRange);
  const count = activities?.data.length || 0;
  const createActivity = useMutation(api.activities.create);
  const iconName = Platform.OS === 'ios' ? 'ios-search' : 'md-search';
  const curDate = useCurrentDateTime();
  const lastFeedTimestamp = activities?.data?.find(
    (v) => v.activity.type === ActivityType.Feed
  )?.activity?.timestamp;
  return (
    <Page title="Baby Tracker">
      <View className="p-4">
        <View style={{ minHeight: 2 }} className="flex-1 w-full h-full">
          {lastFeedTimestamp ? (
            <View className="border p-4 border-red-200 bg-red-400 rounded-lg">
              <Text>
                Last Feed:{' '}
                {timeAgo({
                  curDateTime: curDate,
                  dateTime: DateTime.fromISO(lastFeedTimestamp),
                  format: Format.HoursAndMinutes,
                })}
              </Text>
            </View>
          ) : null}
          <ActivityList activities={activities?.data || []} />
        </View>
      </View>
    </Page>
  );
}

function defaultDateRange() {
  const curDate = DateTime.now();
  return {
    fromTs: curDate.minus({ days: 7 }).toUTC().toISO(),
    toTs: curDate.toUTC().toISO(),
  };
}
export default App;
