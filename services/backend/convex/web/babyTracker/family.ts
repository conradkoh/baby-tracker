/**
 * Web baby tracker family endpoints.
 * Auth is session-based (no device IDs).
 * Pattern: sessionId → userId → family → activityStream
 *
 * Schema note: the family table currently uses devices:[{deviceId}] for mobile.
 * For web, a parallel members:[{userId}] field will be added to family (TODO: schema migration).
 */
import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { mutation, query } from '../../_generated/server';
import { requireAuth } from './helpers';

/**
 * Initialize a family for the authenticated web user.
 * Idempotent: if the user already belongs to a family, returns the existing family.
 * On first call, creates a single-member family and its activityStream.
 *
 * TODO: requires schema addition — family.members: [{userId}] and index by_userId
 */
export const initUser = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'initUser not yet implemented' });
  },
});

/**
 * Get the family the authenticated user belongs to, including any pending join requests.
 *
 * TODO: requires schema addition — family.members: [{userId}] and index by_userId
 */
export const get = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'get not yet implemented' });
  },
});

/**
 * Request to join an existing family.
 * The requesting user's join request will appear in the family owner's pending list.
 *
 * TODO: requires schema addition — familyJoinRequests.userId field (alongside or replacing deviceId)
 */
export const requestJoin = mutation({
  args: {
    ...SessionIdArg,
    familyId: v.id('family'),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'requestJoin not yet implemented' });
  },
});

/**
 * Approve a join request from another user.
 * The approving user must already be a member of the family.
 * On approval, the requester's activities are transferred to the family stream.
 *
 * TODO: requires schema addition — familyJoinRequests.userId field
 */
export const approveJoin = mutation({
  args: {
    ...SessionIdArg,
    requesterUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'approveJoin not yet implemented' });
  },
});

/**
 * Leave the authenticated user's current family.
 * If the user is the last member, activities are transferred back to a personal stream.
 *
 * TODO: requires schema addition — family.members: [{userId}]
 */
export const leave = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    // TODO: implement
    throw new ConvexError({ code: 'NOT_IMPLEMENTED', message: 'leave not yet implemented' });
  },
});
