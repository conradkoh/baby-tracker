/**
 * Web baby tracker activity endpoints.
 * Auth is session-based (no device IDs).
 * Pattern: sessionId → userId → family → activityStream → activities
 */
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { mutation, query } from '../../_generated/server';
import { requireAuth } from './helpers';

/**
 * Create a new activity for the authenticated user's family activity stream.
 */
export const create = mutation({
  args: {
    ...SessionIdArg,
    activity: v.any(), // TODO: replace with typed activity validator
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'create not yet implemented' });
  },
});

/**
 * Update an existing activity owned by the authenticated user's family.
 */
export const update = mutation({
  args: {
    ...SessionIdArg,
    activityId: v.id('activities'),
    activity: v.any(), // TODO: replace with typed activity validator
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'update not yet implemented' });
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
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'deleteActivity not yet implemented' });
  },
});

/**
 * Get a single activity by ID, scoped to the authenticated user's family.
 */
export const getById = query({
  args: {
    ...SessionIdArg,
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'getById not yet implemented' });
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
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'getByTimestampDescPaginated not yet implemented' });
  },
});
