import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';
import { DateTime } from 'luxon';
import { paginationOptsValidator } from 'convex/server';
export type Activity = Doc<'activities'>;
export enum ActivityType {
  Feed = 'feed',
  DiaperChange = 'diaper_change',
}
export const create = mutation({
  args: {
    activity: v.union(
      //feed activity
      v.object({
        timestamp: v.string(),
        type: v.literal('feed'),
        feed: v.union(
          v.object({
            type: v.literal('latch'),
            duration: v.object({
              left: v.object({
                seconds: v.number(),
              }),
              right: v.object({
                seconds: v.number(),
              }),
            }),
          }),
          v.object({
            type: v.union(v.literal('expressed'), v.literal('formula')),
            volume: v.object({
              ml: v.number(),
            }),
          })
        ),
      }),
      //diaper change activity
      v.object({
        timestamp: v.string(),
        type: v.literal('diaper_change'),
        diaperChange: v.object({
          type: v.union(
            v.literal('wet'),
            v.literal('dirty'),
            v.literal('mixed')
          ),
        }),
      })
    ),
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

export const update = mutation({
  args: {
    activityId: v.id('activities'),
    activity: v.union(
      //feed activity
      v.object({
        timestamp: v.string(),
        type: v.literal('feed'),
        feed: v.union(
          v.object({
            type: v.literal('latch'),
            duration: v.object({
              left: v.object({
                seconds: v.number(),
              }),
              right: v.object({
                seconds: v.number(),
              }),
            }),
          }),
          v.object({
            type: v.union(v.literal('expressed'), v.literal('formula')),
            volume: v.object({
              ml: v.number(),
            }),
          })
        ),
      }),
      //diaper change activity
      v.object({
        timestamp: v.string(),
        type: v.literal('diaper_change'),
        diaperChange: v.object({
          type: v.union(
            v.literal('wet'),
            v.literal('dirty'),
            v.literal('mixed')
          ),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db.query('activities').collect();
    //ensure that the activity timestamp is correct
    const ts = DateTime.fromISO(args.activity.timestamp);
    if (!ts.isValid) {
      throw new Error(`invalid timestamp: ${args.activity.timestamp}`);
    }
    await ctx.db.replace(args.activityId, {
      activity: {
        ...args.activity,
        timestamp: ts.toUTC().toISO(),
      },
    });
    return activities;
  },
});
export const deleteActivity = mutation({
  args: {
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.activityId);
  },
});

export const getById = query({
  args: {
    id: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    return activity;
  },
});

export const getByTimestampDescPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const activitiesPaginatedResult = await ctx.db
      .query('activities')
      .withIndex('by_timestamp')
      .order('desc')
      .paginate(args.paginationOpts);

    return activitiesPaginatedResult;
  },
});

//TODO: Deprecate this query
export const expGetByTimestampDescPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const activitiesPaginatedResult = await ctx.db
      .query('activities')
      .withIndex('by_timestamp')
      .order('desc')
      .paginate(args.paginationOpts);

    return activitiesPaginatedResult;
  },
});
