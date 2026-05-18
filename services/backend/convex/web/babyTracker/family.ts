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
import { generateInviteToken } from '../../crypto';

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

// ── Invite mutations (auth required) ───────────────────────────

/**
 * Look up a family invite by token.
 * Public — does not require auth.
 * Returns validity status and family info, or an error reason.
 */
export const getInvite = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query('familyInvites')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!invite) {
      return { valid: false, reason: 'not_found' as const };
    }

    if (invite.expiresAt != null && invite.expiresAt < Date.now()) {
      return { valid: false, reason: 'expired' as const };
    }

    if (invite.usedBy != null) {
      return { valid: false, reason: 'used' as const };
    }

    return {
      valid: true,
      familyId: invite.familyId,
      expiresAt: invite.expiresAt ?? null,
    };
  },
});

/**
 * Create a shareable invite link for the authenticated user's family.
 * Requires the user to be a member of a family.
 * Invite token is valid for 7 days by default.
 */
export const createInvite = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);

    // Verify user is a member of a family
    const membership = await ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (!membership) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'You are not a member of a family',
      });
    }

    const token = generateInviteToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert('familyInvites', {
      familyId: membership.familyId,
      createdBy: userId,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { token };
  },
});

/**
 * Accept a family invite by token.
 * Joins the authenticated user to the family and marks the invite as used.
 * Fails if the invite is expired, already used, or the user is already in a family.
 */
export const acceptInvite = mutation({
  args: {
    ...SessionIdArg,
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx, args.sessionId);

    // Look up the invite
    const invite = await ctx.db
      .query('familyInvites')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!invite) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Invite not found',
      });
    }

    if (invite.expiresAt != null && invite.expiresAt < Date.now()) {
      throw new ConvexError({
        code: 'EXPIRED',
        message: 'This invite has expired',
      });
    }

    if (invite.usedBy != null) {
      throw new ConvexError({
        code: 'USED',
        message: 'This invite has already been used',
      });
    }

    // Verify user is not already in a family
    const existingMembership = await ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (existingMembership) {
      throw new ConvexError({
        code: 'ALREADY_MEMBER',
        message: 'You are already a member of a family',
      });
    }

    // Add user to family
    await ctx.db.insert('userFamily', {
      userId,
      familyId: invite.familyId,
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, { usedBy: userId });

    return { success: true };
  },
});
