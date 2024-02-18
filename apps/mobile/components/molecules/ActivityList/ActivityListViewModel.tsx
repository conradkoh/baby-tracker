import { Activity } from '@workspace/backend/convex/activities';
import { DateTime } from 'luxon';

export enum ActivityListViewableItemType {
  Activity = 'activity',
  Section = 'date_separator',
}
// export type ActivityListViewableItemTypeLiteral = `${ActivityListViewableItemType}`

export type ActivityListViewableItem =
  | {
      type: ActivityListViewableItemType.Activity;
      activity: Activity;
    }
  | {
      type: ActivityListViewableItemType.Section;
      section: {
        title: string;
      };
    };

/**
 * Create view model list from activity list.
 * NOTE: this function assumes the input list is already sorted by timestamp
 * @param list
 * @returns
 */
export function viewModelFromActivities(
  list: Activity[]
): ActivityListViewableItem[] {
  return list.reduce(
    (state, activity) => {
      //insert sections
      const activityDate = DateTime.fromISO(
        activity.activity.timestamp
      ).toFormat('dd MMM yyyy');
      if (state.lastDate != activityDate) {
        state.lastDate = activityDate;
        state.viewItems.push({
          type: ActivityListViewableItemType.Section,
          section: {
            title: activityDate,
          },
        });
      }
      //insert activities
      state.viewItems.push({
        type: ActivityListViewableItemType.Activity,
        activity: activity,
      });
      return state;
    },
    {
      lastDate: null as null | string,
      viewItems: [] as ActivityListViewableItem[],
    }
  ).viewItems;
}
