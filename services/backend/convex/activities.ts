import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { ConvexActivityRepository } from '../src/infra/ConvexActivityRepository';
import {
  createActivity as createActivityUsecase,
  updateActivity as updateActivityUsecase,
  deleteActivity as deleteActivityUsecase,
  getActivityById as getActivityByIdUsecase,
  getActivities as getActivitiesUsecase,
} from '../src/domain/usecases/activity';

// ── Public types ───────────────────────────────────────────────

/**
 * Runtime shape returned by the mobile endpoints.
 * `getById` returns the inner activity (no `_id`).
 * `getByTimestampDescPaginated` returns the inner activity with `_id`.
 * Timestamps are epoch milliseconds.
 */
export type Activity = {
  type: 'feed';
  timestamp: number;
  feed: {
    type: 'latch';
    duration: { left?: { seconds?: number }; right?: { seconds?: number } };
  } | {
    type: 'expressed' | 'formula' | 'water';
    volume: { ml: number };
  } | {
    type: 'solids';
    description: string;
  };
  _id?: string;
} | {
  type: 'diaper_change';
  timestamp: number;
  diaperChange: {
    type: 'wet' | 'dirty' | 'mixed';
  };
  _id?: string;
} | {
  type: 'medical';
  timestamp: number;
  medical: {
    type: 'temperature';
    temperature: { value: number };
  } | {
    type: 'medicine';
    medicine: { name: string; unit: string; value: number };
  };
  _id?: string;
};

export enum ActivityType {
  Feed = 'feed',
  DiaperChange = 'diaper_change',
  Medical = 'medical',
}

// ── Mutations ──────────────────────────────────────────────────

export const create = mutation({
  args: {
    deviceId: v.string(),
    activity: v.union(
      //feed activity
      v.object({
        timestamp: v.number(),
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
        timestamp: v.number(),
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
        timestamp: v.number(),
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
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    const activityId = await createActivityUsecase(repo, args.deviceId, args.activity);
    return { activityId };
  },
});

export const update = mutation({
  args: {
    deviceId: v.string(),
    activityId: v.id('activities'),
    activity: v.union(
      //feed activity
      v.object({
        timestamp: v.number(),
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
        timestamp: v.number(),
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
        timestamp: v.number(),
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
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    await updateActivityUsecase(repo, args.deviceId, args.activityId, args.activity);
    // Maintain backward-compatible return: all activities
    const activities = await ctx.db.query('activities').collect();
    return activities;
  },
});

export const deleteActivity = mutation({
  args: {
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    await deleteActivityUsecase(repo, args.activityId);
  },
});

// ── Queries ────────────────────────────────────────────────────

export const get = query({
  args: {},
  handler: async (ctx, _args) => {
    // Unscoped "get all" — no device context; kept as direct DB query
    const activities = await ctx.db.query('activities').collect();
    return activities;
  },
});

export const getById = query({
  args: {
    deviceId: v.string(),
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    return await getActivityByIdUsecase(repo, args.deviceId, args.activityId);
  },
});

export const getByTimestampDescPaginated = query({
  args: {
    deviceId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    return await getActivitiesUsecase(repo, args.deviceId, args.paginationOpts);
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
