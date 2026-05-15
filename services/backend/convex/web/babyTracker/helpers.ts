/**
 * Shared access control helpers for web baby tracker endpoints.
 *
 * Pattern: sessionId → userId → family → activityStream → activities
 *
 * Each helper is a plain async function (NOT a Convex query/mutation wrapper)
 * that accepts a Convex ctx and performs access checks inline.
 */
import { MutationCtx, QueryCtx } from '../../_generated/server';
import { Id, Doc } from '../../_generated/dataModel';
import { ConvexError } from 'convex/values';

/**
 * Resolve the authenticated userId from a session.
 *
 * Queries the sessions table by sessionId index (`by_sessionId`).
 *
 * @param ctx - Convex mutation or query context
 * @param sessionId - The session identifier from the client
 * @returns The authenticated user's ID
 * @throws ConvexError({ code: 'UNAUTHENTICATED' }) if session is not found or has no linked userId
 */
export async function requireAuth(
  ctx: MutationCtx | QueryCtx,
  sessionId: string
): Promise<{ userId: Id<'users'> }> {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
    .first();
  if (!session?.userId) {
    throw new ConvexError({ code: 'UNAUTHENTICATED', message: 'Not authenticated' });
  }
  return { userId: session.userId };
}

/**
 * Resolve the family and activity stream for an authenticated user.
 *
 * Queries the userFamily join table by userId index (`by_userId`) to find the
 * user's family, then queries the activityStream table by familyId index
 * (`by_familyId`) to find the family's activity stream.
 *
 * @param ctx - Convex mutation or query context
 * @param userId - The authenticated user's ID
 * @returns The familyId and activityStreamId scoped to the user's family
 * @throws ConvexError({ code: 'FORBIDDEN' }) if the user is not a member of any family
 */
export async function requireFamilyAccess(
  ctx: MutationCtx | QueryCtx,
  userId: Id<'users'>
): Promise<{ familyId: Id<'family'>; activityStreamId: Id<'activityStream'> }> {
  // Find the user's family membership
  const membership = await ctx.db
    .query('userFamily')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();
  if (!membership) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Not a member of any family' });
  }

  // Find the family's activity stream
  const stream = await ctx.db
    .query('activityStream')
    .withIndex('by_familyId', (q) => q.eq('family.id', membership.familyId))
    .first();
  if (!stream) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Family activity stream not found' });
  }

  return { familyId: membership.familyId, activityStreamId: stream._id };
}

/**
 * Combined auth + family access check.
 *
 * Calls {@link requireAuth} then {@link requireFamilyAccess}, returning the
 * combined userId, familyId, and activityStreamId in a single result.
 *
 * @param ctx - Convex mutation or query context
 * @param sessionId - The session identifier from the client
 * @returns The authenticated userId, familyId, and activityStreamId
 * @throws ConvexError({ code: 'UNAUTHENTICATED' }) if session is invalid
 * @throws ConvexError({ code: 'FORBIDDEN' }) if user is not a member of any family
 */
export async function requireAuthAndFamily(
  ctx: MutationCtx | QueryCtx,
  sessionId: string
): Promise<{
  userId: Id<'users'>;
  familyId: Id<'family'>;
  activityStreamId: Id<'activityStream'>;
}> {
  const { userId } = await requireAuth(ctx, sessionId);
  const { familyId, activityStreamId } = await requireFamilyAccess(ctx, userId);
  return { userId, familyId, activityStreamId };
}

/**
 * Verify that an activity exists and belongs to the user's family.
 *
 * Fetches the activity by ID, resolves the user's family activity stream,
 * and checks that the activity's activityStreamId matches the family's stream.
 *
 * @param ctx - Convex mutation or query context
 * @param userId - The authenticated user's ID
 * @param activityId - The activity to check access for
 * @returns The activity document if access is granted
 * @throws ConvexError({ code: 'NOT_FOUND' }) if the activity does not exist
 * @throws ConvexError({ code: 'FORBIDDEN' }) if the activity does not belong to the user's family
 */
export async function requireActivityAccess(
  ctx: MutationCtx | QueryCtx,
  userId: Id<'users'>,
  activityId: Id<'activities'>
): Promise<{ activity: Doc<'activities'> }> {
  // Fetch the activity
  const activity = await ctx.db.get(activityId);
  if (!activity) {
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Activity not found' });
  }

  // Resolve the user's family activity stream
  const membership = await ctx.db
    .query('userFamily')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();
  if (!membership) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to access this activity' });
  }

  const stream = await ctx.db
    .query('activityStream')
    .withIndex('by_familyId', (q) => q.eq('family.id', membership.familyId))
    .first();
  if (!stream) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to access this activity' });
  }

  // Verify the activity belongs to the user's family stream
  if (activity.activityStreamId !== stream._id) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to access this activity' });
  }

  return { activity };
}
