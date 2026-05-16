import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ConvexFamilyRepository } from '../src/infra/ConvexFamilyRepository';
import {
  createFamily as createFamilyUsecase,
  deleteFamily as deleteFamilyUsecase,
  requestJoin as requestJoinUsecase,
  approveJoinRequest as approveJoinRequestUsecase,
  leaveFamily as leaveFamilyUsecase,
} from '../src/domain/usecases/family';

export const create = mutation({
  args: {
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
  },
  handler: async (ctx, args) => {
    const repo = new ConvexFamilyRepository(ctx);
    return await createFamilyUsecase(repo, args.deviceId);
  },
});

export const get = query({
  args: { familyId: v.optional(v.id('family')) },
  handler: async (ctx, args) => {
    // Direct DB: ConvexFamilyRepository is mutation-only, so this read query
    // cannot delegate via the repository pattern.
    const familyId = args.familyId;
    if (!familyId) {
      return null;
    }
    const family = await ctx.db.get(familyId);
    if (!family) {
      return null;
    }

    const joinRequests = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (v) => v.eq('familyId', familyId))
      .collect();
    return {
      ...family,
      joinRequests,
    };
  },
});

export const del = mutation({
  args: { authorizingDeviceId: v.string(), familyId: v.id('family') }, // DEPRECATED_DEVICE_SESSION (authorizingDeviceId)
  handler: async (ctx, args) => {
    const repo = new ConvexFamilyRepository(ctx);
    await deleteFamilyUsecase(repo, args.authorizingDeviceId, args.familyId);
  },
});

export const requestJoin = mutation({
  args: {
    familyId: v.string(),
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
  },
  handler: async (ctx, args) => {
    const repo = new ConvexFamilyRepository(ctx);
    return await requestJoinUsecase(repo, args.familyId, args.deviceId);
  },
});

export const approveJoinRequest = mutation({
  args: {
    familyId: v.id('family'),
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION
    authorizingDeviceId: v.string(), // DEPRECATED_DEVICE_SESSION
  },
  handler: async (ctx, args) => {
    const repo = new ConvexFamilyRepository(ctx);
    await approveJoinRequestUsecase(repo, args.familyId, args.deviceId, args.authorizingDeviceId);
  },
});

export const leave = mutation({
  args: { deviceId: v.string(), familyId: v.id('family') }, // DEPRECATED_DEVICE_SESSION
  handler: async (ctx, args) => {
    const repo = new ConvexFamilyRepository(ctx);
    await leaveFamilyUsecase(repo, args.deviceId, args.familyId);
  },
});
