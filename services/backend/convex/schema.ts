import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  //TABLE: activities
  activities: defineTable({
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
                seconds: v.optional(v.number()),
              }),
              right: v.object({
                seconds: v.optional(v.number()),
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
  })
    .index('by_timestamp', ['activity.timestamp'])
    .index('by_type', ['activity.type']),
});
