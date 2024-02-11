import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';
import { DateTime } from 'luxon';
import { produce } from 'immer';
import { FeedType } from '../../../core/domain/entities/Feed';
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
              seconds: v.number(),
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
        diaper_change: v.optional(
          v.object({
            type: v.union(
              v.literal('wet'),
              v.literal('dirty'),
              v.literal('mixed')
            ),
          })
        ),
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
              seconds: v.number(),
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
        diaper_change: v.optional(
          v.object({
            type: v.union(
              v.literal('wet'),
              v.literal('dirty'),
              v.literal('mixed')
            ),
          })
        ),
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

export const getById = query({
  args: {
    id: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db
      .query('activities')
      .filter((v) => v.eq(v.field('_id'), args.id))
      .first();
    return activity;
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
