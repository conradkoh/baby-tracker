import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery, usePaginatedQuery } from 'convex/react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
export { api } from '@workspace/backend/convex/_generated/api';

/**
 * Use activities with pagination for infinite scroll
 * @param args
 * @returns
 */
export function useActivitiesPaginated(args: { fromTs: DateTime<true> }) {
  const fromTs = args.fromTs.toISO();
  //1. get data using useQuery with stable inputs to hit cache
  const activities = useQuery(api.activities.getByTimestampDesc, { fromTs });

  //2. load paginated query to for additional data
  const { results: moreActivities, loadMore } = usePaginatedQuery(
    api.activities.getByTimestampDescPaginated,
    { strictBeforeTs: fromTs },
    { initialNumItems: 1 } //should be 0, but set as 1 because convex does not allow 0
  );

  //3. combine the lists to make this transparent to users
  const activityList = useMemo(() => {
    return [...(activities || []), ...moreActivities];
  }, [activities, moreActivities]);
  return {
    results: activityList,
    loadMore,
  };
}
