import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    activity: v.object({
      timestamp: v.number(),
      type: v.string(), //feed, diaper_change
      feed: v.optional(
        v.object({
          type: v.string(), //latch, expressed, formula
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
    const activityId = await ctx.db.insert('activities', {
      activity: args.activity,
    });
  },
});

export const get = query({
  args: {},
  handler: async (ctx, args) => {
    const activities = await ctx.db.query('activities').collect();
    return activities;
  },
});
