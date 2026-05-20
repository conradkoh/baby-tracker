/**
 * Web baby tracker activity endpoints.
 * Auth is session-based (no device IDs).
 * Pattern: sessionId → userId → family → activityStream → activities
 */
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { mutation, query } from '../../_generated/server';
import { ConvexError } from 'convex/values';
import { DateTime } from 'luxon';
import { ConvexWebActivityRepository } from '../../../src/infra/ConvexWebActivityRepository';
import {
  createActivity as createActivityUseCase,
  updateActivity as updateActivityUseCase,
  deleteActivity as deleteActivityUseCase,
  getActivityById as getActivityByIdUseCase,
  getActivities as getActivitiesUseCase,
  getLast24hSummary as getLast24hSummaryUseCase,
} from '../../../src/domain/usecases/activity';
import { requireAuthAndFamily } from './helpers';

// ── Activity validator (shared between create and update) ────────

const activityValidator = v.union(
  // feed activity
  v.object({
    timestamp: v.string(),
    type: v.literal('feed'),
    feed: v.union(
      v.object({
        type: v.literal('latch'),
        duration: v.object({
          left: v.object({ seconds: v.number() }),
          right: v.object({ seconds: v.number() }),
        }),
      }),
      v.object({
        type: v.union(
          v.literal('expressed'),
          v.literal('formula'),
          v.literal('water')
        ),
        volume: v.object({ ml: v.number() }),
      }),
      v.object({
        type: v.literal('solids'),
        description: v.string(),
      })
    ),
  }),
  // diaper change activity
  v.object({
    timestamp: v.string(),
    type: v.literal('diaper_change'),
    diaperChange: v.object({
      type: v.union(
        v.literal('wet'),
        v.literal('dirty'),
        v.literal('mixed')
      ),
      remarks: v.optional(v.string()),
    }),
  }),
  // medical activity
  v.object({
    timestamp: v.string(),
    type: v.literal('medical'),
    medical: v.union(
      v.object({
        type: v.literal('temperature'),
        temperature: v.object({ value: v.number() }),
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
);

// ── Mutations ──────────────────────────────────────────────────

/**
 * Create a new activity for the authenticated user's family activity stream.
 */
export const create = mutation({
  args: {
    ...SessionIdArg,
    activity: activityValidator,
  },
  handler: async (ctx, args) => {
    const { userId, activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    const activityId = await createActivityUseCase(repo, userId.toString(), args.activity);
    return { activityId };
  },
});

/**
 * Update an existing activity owned by the authenticated user's family.
 */
export const update = mutation({
  args: {
    ...SessionIdArg,
    activityId: v.id('activities'),
    activity: activityValidator,
  },
  handler: async (ctx, args) => {
    const { userId, activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    await updateActivityUseCase(repo, userId.toString(), args.activityId.toString(), args.activity);
  },
});

/**
 * Delete an activity owned by the authenticated user's family.
 */
export const deleteActivity = mutation({
  args: {
    ...SessionIdArg,
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const { activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    await deleteActivityUseCase(repo, args.activityId.toString());
  },
});

// ── Queries ────────────────────────────────────────────────────

/**
 * Get a single activity by ID, scoped to the authenticated user's family.
 */
export const getById = query({
  args: {
    ...SessionIdArg,
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const { userId, activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    const activity = await getActivityByIdUseCase(repo, userId.toString(), args.activityId.toString());
    if (!activity) {
      return { status: 'not_found' as const };
    }
    return { status: 'found' as const, data: { ...activity, _id: args.activityId } };
  },
});

/**
 * List activities for the authenticated user's family, paginated and ordered by timestamp descending.
 */
export const getByTimestampDescPaginated = query({
  args: {
    ...SessionIdArg,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { userId, activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    return await getActivitiesUseCase(repo, userId.toString(), args.paginationOpts);
  },
});

/**
 * Get a summary of all feed and diaper activities from the last 24 hours.
 * The nowIso argument is rounded to the nearest 5-min bucket by the client
 * using useNowBucket5Min(), so Convex can memoize the result per bucket.
 */
export const getLast24hSummary = query({
  args: {
    ...SessionIdArg,
    nowIso: v.string(),
  },
  handler: async (ctx, args) => {
    const { activityStreamId } = await requireAuthAndFamily(ctx, args.sessionId);
    const repo = new ConvexWebActivityRepository(ctx, activityStreamId);
    const nowMs = DateTime.fromISO(args.nowIso).toMillis();
    if (!Number.isFinite(nowMs)) {
      throw new ConvexError({ code: 'BAD_REQUEST', message: 'Invalid nowIso' });
    }
    return await getLast24hSummaryUseCase(repo, nowMs);
  },
});
