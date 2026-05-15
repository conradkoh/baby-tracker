import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';
import { paginationOptsValidator } from 'convex/server';
import { ConvexActivityRepository } from '../src/infra/ConvexActivityRepository';
import {
  createActivity as createActivityUsecase,
  updateActivity as updateActivityUsecase,
  deleteActivity as deleteActivityUsecase,
  getActivityById as getActivityByIdUsecase,
  getActivities as getActivitiesUsecase,
} from '../src/domain/usecases/activity';

// ── Public types (backward-compatible exports) ─────────────────

export type Activity = Doc<'activities'>;
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
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    const activityId = await createActivityUsecase(repo, args.deviceId, args.activity as any);
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
  },
  handler: async (ctx, args) => {
    const repo = new ConvexActivityRepository(ctx);
    await updateActivityUsecase(repo, args.deviceId, args.activityId, args.activity as any);
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
  handler: async (ctx, args) => {
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
