/**
 * Web-specific IFamilyRepository that uses the userFamily join table
 * for session-based (web) family membership instead of the device-based
 * (mobile) family.devices array.
 *
 * This repository is mutation-only (constructor requires GenericMutationCtx)
 * — the same constraint as the mobile ConvexFamilyRepository.
 */
import type { GenericMutationCtx } from 'convex/server';
import type { DataModel, Id } from '../../convex/_generated/dataModel';
import type { IFamilyRepository } from '../domain/repositories/IFamilyRepository';
import type { Family, FamilyJoinRequest } from '../domain/family/Family';
import { ConvexError } from 'convex/values';

export class ConvexWebFamilyRepository implements IFamilyRepository {
  constructor(private ctx: GenericMutationCtx<DataModel>) {}

  /**
   * Create a family for a web user. Idempotent: if the user already
   * belongs to a family, returns the existing familyId.
   *
   * @param userId - The web user's ID (maps to IFamilyRepository.create's deviceId param)
   */
  async create(userId: string): Promise<string> {
    const uid = userId as Id<'users'>;

    // Idempotent: return existing family if user already has one
    const existing = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', uid))
      .first();
    if (existing) return existing.familyId;

    // Create family (no devices — web members are tracked via userFamily)
    const familyId = await this.ctx.db.insert('family', {
      children: [],
      devices: [],
    });

    // Create family activity stream
    await this.ctx.db.insert('activityStream', {
      type: 'family',
      family: { id: familyId },
    });

    // Create userFamily membership
    await this.ctx.db.insert('userFamily', { userId: uid, familyId });

    return familyId;
  }

  /**
   * Get a family by ID, including all join requests (both device-based
   * mobile requests and userId-based web requests).
   */
  async getById(familyId: string): Promise<(Family & { joinRequests: FamilyJoinRequest[] }) | null> {
    const family = await this.ctx.db.get(familyId as Id<'family'>);
    if (!family) return null;

    const joinRequests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (q) => q.eq('familyId', familyId as Id<'family'>))
      .collect();

    return {
      ...family,
      joinRequests: joinRequests.map((r) => ({
        deviceId: r.deviceId,
        familyId: r.familyId,
        status: r.status,
        userId: r.userId,
      })),
    };
  }

  /**
   * Delete a family. Verifies the authorizing user is a member via the
   * userFamily join table.
   *
   * TODO: activity transfer not implemented — no personal user stream
   * in current schema.
   */
  async delete(authorizingUserId: string, familyId: string): Promise<void> {
    const fid = familyId as Id<'family'>;

    // Verify authorizing user is a member
    const membership = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', authorizingUserId as Id<'users'>))
      .first();
    if (!membership || membership.familyId !== fid) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to delete this family' });
    }

    // Delete the authorizing user's membership
    await this.ctx.db.delete(membership._id);

    // Delete all userFamily entries for this family
    const remainingMemberships = await this.ctx.db
      .query('userFamily')
      .withIndex('by_familyId', (q) => q.eq('familyId', fid))
      .collect();
    await Promise.all(remainingMemberships.map((m) => this.ctx.db.delete(m._id)));

    // Delete the family record
    await this.ctx.db.delete(fid);

    // Delete all join requests for this family
    const requests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (q) => q.eq('familyId', fid))
      .collect();
    await Promise.all(requests.map((r) => this.ctx.db.delete(r._id)));

    // TODO: activity transfer not implemented — no personal user stream in current schema
  }

  /**
   * Request to join a family. Uses userId instead of deviceId for
   * web-based join requests.
   */
  async requestJoin(familyId: string, userId: string): Promise<{ isError: boolean; message: string }> {
    const uid = userId as Id<'users'>;
    const fid = familyId as Id<'family'>;

    // Verify family exists
    const family = await this.ctx.db.get(fid);
    if (!family) {
      return { isError: true, message: 'The provided family ID does not exist' };
    }

    // Prevent a user who is already a member of any family from submitting a request
    const currentMembership = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', uid))
      .first();
    if (currentMembership) {
      return { isError: true, message: 'You are already a member of a family.' };
    }

    // Check for existing requests from this user
    const existingRequests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_userId', (q) => q.eq('userId', uid))
      .collect();

    // Delete requests not from this family (user can only belong to one family)
    await Promise.all(
      existingRequests
        .filter((r) => r.familyId !== fid)
        .map((r) => this.ctx.db.delete(r._id))
    );

    const existing = existingRequests.find((r) => r.familyId === fid);
    if (existing) {
      if (existing.status === 'pending') {
        return { isError: true, message: 'Your pending request has not been approved yet.' };
      }
      return { isError: true, message: 'You are already a part of this family.' };
    }

    // Insert join request (deviceId required by schema — empty string for web users)
    await this.ctx.db.insert('familyJoinRequests', {
      deviceId: '',
      familyId: fid,
      status: 'pending',
      userId: uid,
    });

    return { isError: false, message: 'Your request has been submitted and is pending approval.' };
  }

  /**
   * Approve a pending join request from a web user. Verifies the authorizing
   * user is a member of the family.
   *
   * TODO: activity transfer not implemented — no personal user stream
   * for web users in current schema.
   */
  async approveJoinRequest(
    familyId: string,
    requesterUserId: string,
    authorizingUserId: string
  ): Promise<void> {
    const fid = familyId as Id<'family'>;
    const ruid = requesterUserId as Id<'users'>;
    const auid = authorizingUserId as Id<'users'>;

    // Verify authorizer is a member of the family
    const authorizerMembership = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', auid))
      .first();
    if (!authorizerMembership || authorizerMembership.familyId !== fid) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to approve join requests' });
    }

    // Find the join request
    const joinRequest = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_userId', (q) => q.eq('userId', ruid))
      .first();
    if (!joinRequest || joinRequest.familyId !== fid) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'join request not found' });
    }

    // Guard: if the requester is already a member (e.g. approve called twice), skip insert
    const alreadyMember = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', ruid))
      .first();
    if (alreadyMember && alreadyMember.familyId === fid) {
      // Already approved — delete the stale join request and return idempotently
      await this.ctx.db.delete(joinRequest._id);
      return;
    }

    // Add requester to userFamily
    await this.ctx.db.insert('userFamily', { userId: ruid, familyId: fid });

    // Delete the join request
    await this.ctx.db.delete(joinRequest._id);

    // TODO: activity transfer not implemented — no personal user stream for web users in current schema
  }

  /**
   * Leave a family. Removes the userFamily entry. If the user is the
   * last member, the family and orphaned activity stream require manual
   * cleanup.
   *
   * TODO: dissolve family and handle orphaned activity stream when last member leaves
   */
  async leave(userId: string, familyId: string): Promise<void> {
    const uid = userId as Id<'users'>;
    const fid = familyId as Id<'family'>;

    // Find and delete the userFamily entry
    const membership = await this.ctx.db
      .query('userFamily')
      .withIndex('by_userId', (q) => q.eq('userId', uid))
      .first();
    if (!membership || membership.familyId !== fid) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'user is not a member of this family' });
    }
    await this.ctx.db.delete(membership._id);

    // Check remaining members
    const remaining = await this.ctx.db
      .query('userFamily')
      .withIndex('by_familyId', (q) => q.eq('familyId', fid))
      .collect();

    if (remaining.length === 0) {
      // TODO: dissolve family and handle orphaned activity stream when last member leaves
    }
  }
}
