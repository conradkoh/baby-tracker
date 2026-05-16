import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ConvexDeviceRepository } from '../src/infra/ConvexDeviceRepository';
import {
  syncDevice as syncDeviceUsecase,
  getDevice as getDeviceUsecase,
  getFamilyJoinRequests as getFamilyJoinRequestsUsecase,
} from '../src/domain/usecases/device';

export const get = query({
  args: { deviceId: v.string() }, // DEPRECATED_DEVICE_SESSION
  handler: async (ctx, args) => {
    const repo = new ConvexDeviceRepository(ctx);
    return await getDeviceUsecase(repo, args.deviceId);
  },
});

export const sync = mutation({
  args: {
    deviceId: v.string(), // DEPRECATED_DEVICE_SESSION — this must be generated on the client
    deviceName: v.optional(v.string()),
    osName: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const repo = new ConvexDeviceRepository(ctx);
    await syncDeviceUsecase(repo, {
      deviceId: args.deviceId,
      deviceName: args.deviceName,
      osName: args.osName,
      osVersion: args.osVersion,
      brand: args.brand,
    });
  },
});

export const getFamilyJoinRequests = query({
  args: { deviceId: v.optional(v.string()) }, // DEPRECATED_DEVICE_SESSION
  handler: async (ctx, args) => {
    const repo = new ConvexDeviceRepository(ctx);
    return await getFamilyJoinRequestsUsecase(repo, args.deviceId);
  },
});
