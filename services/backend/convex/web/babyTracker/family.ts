/**
 * Web baby tracker family endpoints.
 * Auth is session-based (no device IDs).
 * Pattern: sessionId → userId → family → activityStream
 *
 * Uses the userFamily join table for session-based (web) family membership
 * alongside the existing family.devices array for mobile devices.
 */
import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { mutation, query } from '../../_generated/server';
import { ConvexWebFamilyRepository } from '../../../src/infra/ConvexWebFamilyRepository';
import {
  createFamily,
  requestJoin as requestJoinUseCase,
  approveJoinRequest as approveJoinRequestUseCase,
  leaveFamily as leaveFamilyUseCase,
} from '../../../src/domain/usecases/family';
import { requireAuth } from './helpers';

// ── Mutations ──────────────────────────────────────────────────

/**
 * Initialize a family for the authenticated web user.
 * Idempotent: if the user already belongs to a family, returns the existing family.
 * On first call, creates a single-member family and its activityStream.
 */
export const initUser = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    const repo = new ConvexWebFamilyRepository(ctx);
    const familyId = await createFamily(repo, userId.toString());
    return { familyId };
  },
});

/**
 * Request to join an existing family.
 * The requesting user's join request will appear in the family members' pending list.
 */
export const requestJoin = mutation({
  args: {
    ...SessionIdArg,
    familyId: v.id('family'),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);
    const repo = new ConvexWebFamilyRepository(ctx);
    return await requestJoinUseCase(repo, args.familyId.toString(), userId.toString());
  },
});

/**
 * Approve a join request from another user.
 * The approving user must already be a member of the family.
 */
export const approveJoin = mutation({
  args: {
    ...SessionIdArg,
    requesterUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId: authorizingUserId } = await requireAuth(ctx, args.sessionId);

    // Verify the authorizing user is a member of a family
    const membership = await ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', authorizingUserId))
      .first();
    if (!membership) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not a family member' });
    }

    const repo = new ConvexWebFamilyRepository(ctx);
    await approveJoinRequestUseCase(
      repo,
      membership.familyId.toString(),
      args.requesterUserId.toString(),
      authorizingUserId.toString()
    );
  },
});

/**
 * Leave the authenticated user's current family.
 * If the user is the last member, the family's activity stream becomes orphaned
 * (future work: dissolve family and transfer activities).
 */
export const leave = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);

    // Verify the user is a member of a family
    const membership = await ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (!membership) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not a family member' });
    }

    const repo = new ConvexWebFamilyRepository(ctx);
    await leaveFamilyUseCase(repo, userId.toString(), membership.familyId.toString());
  },
});

// ── Queries ────────────────────────────────────────────────────

/**
 * Get the family the authenticated user belongs to, including any pending
 * join requests (both device-based mobile and userId-based web requests).
 *
 * Uses direct DB access because ConvexWebFamilyRepository is mutation-only.
 */
export const get = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);

    // Find the user's family membership via the userFamily join table
    const membership = await ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (!membership) return null;

    // Fetch the family document
    const family = await ctx.db.get(membership.familyId);
    if (!family) return null;

    // Fetch pending join requests for this family
    const joinRequests = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (q) => q.eq('familyId', membership.familyId))
      .collect();

    return {
      ...family,
      joinRequests,
    };
  },
});
