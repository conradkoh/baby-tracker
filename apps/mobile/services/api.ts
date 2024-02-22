import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery, usePaginatedQuery } from 'convex/react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';

export { api } from '@workspace/backend/convex/_generated/api';
export function useActivitiesPaginated(args: { fromTs: DateTime }) {
  const fromTs = args.fromTs.toISO();
  if (fromTs === null)
    throw new Error('useActivitiesPaginated received an invalid date');
  //use the useQuery hook to ensure that the input parameters are stable, since usePaginatedQuery busts the cache always
  const activities = useQuery(api.activities.getByTimestampDesc, { fromTs });
  const { results: moreActivities, loadMore } = usePaginatedQuery(
    api.activities.getByTimestampDescPaginated,
    { strictBeforeTs: fromTs },
    { initialNumItems: 1 } //ideally we can set this number to 0 but convex does not allow this.
  );
  const activityList = useMemo(() => {
    //combine the lists
    return [...(activities || []), ...moreActivities];
  }, [activities, moreActivities]);
  return {
    results: activityList,
    loadMore,
  };
}
