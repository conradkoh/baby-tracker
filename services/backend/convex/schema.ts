import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // =====================
  // BABY TRACKER TABLES
  // =====================

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
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
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
        deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
      })
    ),
  }),

  //TABLE: Family Join Requests
  familyJoinRequests: defineTable({
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
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
          deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
        }),
      })
    )
  )
    .index('by_familyId', ['family.id'])
    .index('by_deviceId', ['device.deviceId']),

  // =====================
  // UPSTREAM INFRA TABLES
  // =====================

  /**
   * Application metadata and version tracking.
   */
  appInfo: defineTable({
    latestVersion: v.string(),
  }),

  /**
   * Presentation state management for real-time presentation controls.
   */
  presentationState: defineTable({
    key: v.string(),
    currentSlide: v.number(),
    lastUpdated: v.number(),
    activePresentation: v.optional(
      v.object({
        presenterId: v.string(),
      })
    ),
  }).index('by_key', ['key']),

  /**
   * Discussion state management for collaborative discussions.
   */
  discussionState: defineTable({
    key: v.string(),
    title: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    conclusions: v.optional(
      v.array(
        v.object({
          text: v.string(),
          tags: v.array(v.string()),
        })
      )
    ),
    concludedAt: v.optional(v.number()),
    concludedBy: v.optional(v.string()),
  }).index('by_key', ['key']),

  /**
   * Individual messages within discussions.
   */
  discussionMessages: defineTable({
    discussionKey: v.string(),
    name: v.string(),
    message: v.string(),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  }).index('by_discussion', ['discussionKey']),

  /**
   * Checklist state management for collaborative task tracking.
   */
  checklistState: defineTable({
    key: v.string(),
    title: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    concludedAt: v.optional(v.number()),
    concludedBy: v.optional(v.string()),
  }).index('by_key', ['key']),

  /**
   * Individual items within checklists.
   */
  checklistItems: defineTable({
    checklistKey: v.string(),
    text: v.string(),
    isCompleted: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    createdBy: v.optional(v.string()),
    completedBy: v.optional(v.string()),
  })
    .index('by_checklist', ['checklistKey'])
    .index('by_checklist_order', ['checklistKey', 'order']),

  /**
   * Attendance tracking for events and meetings.
   */
  attendanceRecords: defineTable({
    attendanceKey: v.string(),
    timestamp: v.number(),
    userId: v.optional(v.id('users')),
    name: v.optional(v.string()),
    status: v.optional(v.union(v.literal('attending'), v.literal('not_attending'))),
    reason: v.optional(v.string()),
    remarks: v.optional(v.string()),
    isManuallyJoined: v.optional(v.boolean()),
  })
    .index('by_attendance', ['attendanceKey'])
    .index('by_name_attendance', ['attendanceKey', 'name'])
    .index('by_user_attendance', ['attendanceKey', 'userId']),

  /**
   * User accounts supporting authenticated, anonymous, and Google OAuth users.
   */
  users: defineTable(
    v.union(
      v.object({
        type: v.literal('full'),
        name: v.string(),
        username: v.optional(v.string()),
        email: v.string(),
        recoveryCode: v.optional(v.string()),
        accessLevel: v.optional(v.union(v.literal('user'), v.literal('system_admin'))),
        google: v.optional(
          v.object({
            id: v.string(),
            email: v.string(),
            verified_email: v.optional(v.boolean()),
            name: v.string(),
            given_name: v.optional(v.string()),
            family_name: v.optional(v.string()),
            picture: v.optional(v.string()),
            locale: v.optional(v.string()),
            hd: v.optional(v.string()),
          })
        ),
      }),
      v.object({
        type: v.literal('anonymous'),
        name: v.string(),
        recoveryCode: v.optional(v.string()),
        accessLevel: v.optional(v.union(v.literal('user'), v.literal('system_admin'))),
      })
    )
  )
    .index('by_username', ['username'])
    .index('by_email', ['email'])
    .index('by_name', ['name'])
    .index('by_googleId', ['google.id']),

  /**
   * User sessions for authentication and state management.
   */
  sessions: defineTable({
    sessionId: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    authMethod: v.optional(
      v.union(
        v.literal('google'),
        v.literal('login_code'),
        v.literal('recovery_code'),
        v.literal('anonymous'),
        v.literal('username_password')
      )
    ),
    expiresAt: v.optional(v.number()), // DEPRECATED
    expiresAtLabel: v.optional(v.string()), // DEPRECATED
    lastActivityAt: v.optional(v.number()),
    deviceInfo: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        device: v.optional(v.string()),
      })
    ),
  })
    .index('by_sessionId', ['sessionId'])
    .index('by_userId', ['userId']),

  /**
   * Temporary login codes for cross-device authentication.
   */
  loginCodes: defineTable({
    code: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index('by_code', ['code']),

  /**
   * Rate limiting for login attempts to prevent brute force attacks.
   */
  loginAttempts: defineTable({
    sessionId: v.string(),
    attemptCount: v.number(),
    lastAttemptAt: v.number(),
    lockedUntil: v.optional(v.number()),
  }).index('by_sessionId', ['sessionId']),

  /**
   * Authentication provider configuration.
   */
  auth_providerConfigs: defineTable({
    type: v.union(v.literal('google')),
    enabled: v.boolean(),
    projectId: v.optional(v.string()),
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    configuredBy: v.id('users'),
    configuredAt: v.number(),
  }).index('by_type', ['type']),

  /**
   * Login requests for authentication provider flows.
   */
  auth_loginRequests: defineTable({
    sessionId: v.string(),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    provider: v.union(v.literal('google')),
    expiresAt: v.number(),
    redirectUri: v.string(),
  }),

  /**
   * Connect requests for authentication provider account linking flows.
   */
  auth_connectRequests: defineTable({
    sessionId: v.string(),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    provider: v.union(v.literal('google')),
    expiresAt: v.number(),
    redirectUri: v.string(),
  }),
});
