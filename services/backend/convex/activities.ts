import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';
import { DateTime } from 'luxon';
export type Activity = Doc<'activities'>;
export enum ActivityType {
  Feed = 'feed',
  DiaperChange = 'diaper_change',
}
export const create = mutation({
  args: {
    activity: v.object({
      timestamp: v.string(),
      type: v.string(), //feed, diaper_change
      feed: v.optional(
        v.object({
          type: v.string(), //latch, expressed, formula
          volume: v.object({
            ml: v.number(),
          }),
        })
      ),
      diaper_change: v.optional(
        v.object({
          type: v.string(), //wet, dirty, mixed
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    //ensure that the activity timestamp is correct
    const ts = DateTime.fromISO(args.activity.timestamp);
    if (!ts.isValid) {
      throw new Error(`invalid timestamp: ${args.activity.timestamp}`);
    }

    const activityId = await ctx.db.insert('activities', {
      activity: {
        ...args.activity,
        timestamp: ts.toUTC().toISO(),
      },
    });
    return {
      activityId,
    };
  },
});

export const get = query({
  args: {},
  handler: async (ctx, args) => {
    const activities = await ctx.db.query('activities').collect();
    return activities;
  },
});

export const getByTimestampDesc = query({
  args: {
    fromTs: v.string(),
    toTs: v.string(),
  },
  handler: async (ctx, args) => {
    const fromTs = DateTime.fromISO(args.fromTs);
    const toTS = DateTime.fromISO(args.toTs);
    const activities = await ctx.db
      .query('activities')
      .withIndex('by_timestamp')
      .filter((v) =>
        v.and(
          v.gte(v.field('activity.timestamp'), fromTs.toISO()),
          v.lte(v.field('activity.timestamp'), toTS.toISO())
        )
      )
      .order('desc')
      .collect();

    return {
      data: activities,
      fromTs: args.fromTs,
      toTs: args.toTs,
    };
  },
});
export const count = query({
  args: {},
  handler: async (ctx, args) => {
    const activities = await ctx.db.query('activities').collect();
    return activities.length;
  },
});
