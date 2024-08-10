import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  //TABLE: activities
  activities: defineTable({
    activityStreamId: v.id('activityStream'),
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
            type: v.union(
              v.literal('expressed'),
              v.literal('formula'),
              v.literal('water')
            ),
            volume: v.object({
              ml: v.number(),
            }),
          }),
          v.object({
            type: v.literal('solids'),
            description: v.string(),
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
      }),
      // medical activity
      v.object({
        timestamp: v.string(),
        type: v.literal('medical'),
        medical: v.union(
          v.object({
            type: v.literal('temperature'),
            temperature: v.object({
              value: v.number(),
            }),
          }),
          v.object({
            type: v.literal('medicine'),
            medicine: v.object({
              name: v.string(),
              unit: v.string(),
              value: v.number(),
            }),
          })
        ),
      })
    ),
  })
    .index('by_timestamp', ['activity.timestamp'])
    .index('by_type', ['activity.type'])
    .index('by_activityStreamId_by_timestamp', [
      'activityStreamId',
      'activity.timestamp',
    ])
    .index('by_activityStreamId', ['activityStreamId']),
  //TABLE: DEVICE
  device: defineTable({
    deviceId: v.string(),
    familyId: v.optional(v.id('family')),
    deviceName: v.optional(v.string()),
    osName: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    brand: v.optional(v.string()),
  }).index('by_deviceId', ['deviceId']),
  //TABLE: FAMILY
  family: defineTable({
    children: v.array(
      v.object({
        iid: v.string(),
        name: v.string(),
        dateOfBirth: v.string(), //YYYY-MM-DD
      })
    ),
    devices: v.array(
      v.object({
        deviceId: v.string(),
      })
    ),
  }),
  //TABLE: Family Join Requests
  familyJoinRequests: defineTable({
    deviceId: v.string(),
    familyId: v.id('family'),
    status: v.string(), //pending or rejected
  })
    .index('by_familyId', ['familyId'])
    .index('by_deviceId', ['deviceId'])
    .index('by_familyId_and_deviceId', ['familyId', 'deviceId']),

  //TABLE: Activity Stream
  activityStream: defineTable(
    v.union(
      v.object({
        type: v.literal('family'),
        family: v.object({
          id: v.id('family'),
        }),
      }),
      v.object({
        type: v.literal('device'),
        device: v.object({
          deviceId: v.string(),
        }),
      })
    )
  )
    .index('by_familyId', ['family.id'])
    .index('by_deviceId', ['device.deviceId']),
});
