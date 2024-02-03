import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  activities: defineTable({
    activity: v.object({
      timestamp: v.number(),
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
  })
    .index('by_timestamp', ['activity.timestamp'])
    .index('by_type', ['activity.type']),
});
