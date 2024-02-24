import { api } from '@workspace/backend/convex/_generated/api';
import { DateTime } from 'luxon';
import { usePaginatedQuery } from '../lib/convex/use_query_swr';
export { api } from '@workspace/backend/convex/_generated/api';
export type { Doc } from '@workspace/backend/convex/_generated/dataModel';

/**
 * Use activities with pagination for infinite scroll
 * @param args
 * @returns
 */
export function useActivitiesPaginated(args: { fromTs: DateTime<true> }) {
  const { results: activities, loadMore } = usePaginatedQuery(
    api.activities.expGetByTimestampDescPaginated,
    {},
    { initialNumItems: 20, sharingKey: 'app-index' }
  );

  return {
    results: activities,
    loadMore,
  };
}
