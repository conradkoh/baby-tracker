import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DeviceStatus } from '../domain/entities/device/DeviceStatus';
export const create = mutation({
  args: {
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query('device')
      .filter((d) => d.eq(d.field('deviceId'), args.deviceId))
      .first();
    if (!device) {
      throw new Error('invalid device id');
    }
    //create a new family
    const familyID = await ctx.db.insert('family', {
      children: [],
      devices: [{ deviceId: args.deviceId, status: DeviceStatus.Active }],
    });

    //link the device to the family
    await ctx.db.patch(device._id, {
      familyId: familyID,
    });

    return familyID;
  },
});

export const get = query({
  args: { familyId: v.optional(v.id('family')) },
  handler: async (ctx, args) => {
    const familyId = args.familyId;
    if (!familyId) {
      return null;
    }
    const family = await ctx.db.get(familyId);
    if (!family) {
      return null;
    }
    return family;
  },
});

export const del = mutation({
  args: { authorizingDeviceId: v.string(), familyId: v.id('family') },
  handler: async (ctx, args) => {
    //check if device belongs to family
    const family = await ctx.db.get(args.familyId);
    const authorizingDevice = family?.devices.find(
      (v) => v.deviceId === args.authorizingDeviceId
    );
    if (!authorizingDevice?.deviceId) {
      throw new Error('not authorized');
    }
    await ctx.db.delete(args.familyId);
  },
});

export const requestJoin = mutation({
  args: {
    familyId: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query('family')
      .filter((v) => v.eq(v.field('_id'), args.familyId))
      .first();
    if (!family) {
      return {
        isError: true,
        message: 'The provided family ID does not exist',
      };
    }
    const device = await ctx.db
      .query('device')
      .filter((v) => v.eq(v.field('deviceId'), args.deviceId))
      .first();
    if (!device) {
      throw new Error('device does not exist');
    }
    const existingDevice = family.devices.find(
      (d) => d.deviceId === args.deviceId
    );
    if (existingDevice) {
      if (existingDevice.status === 'pending') {
        return {
          isError: true,
          message: 'Your pending request has not been approved yet.',
        };
      } else {
        return {
          isError: true,
          message: 'You are already a part of this family.',
        };
      }
    }
    //update the family in the db
    await ctx.db.patch(family._id, {
      devices: [
        ...family.devices,
        { deviceId: args.deviceId, status: 'pending' },
      ],
    });
    //link this device to the family
    await ctx.db.patch(device._id, { familyId: family._id });

    //return the status
    return {
      message: 'Your request has been submitted and is pending approval.',
    };
  },
});

export const approveJoinRequest = mutation({
  args: {
    familyId: v.id('family'),
    deviceId: v.string(),
    authorizingDeviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db
      .query('family')
      .filter((v) => v.eq(v.field('_id'), args.familyId))
      .first();
    if (!family) {
      throw new Error('family does not exist.');
    }
    //ensure that authorizer has permissions to grant access
    const activeAuthorizingDevice = family.devices.find(
      (d) =>
        d.deviceId === args.authorizingDeviceId &&
        d.status === DeviceStatus.Active
    );
    if (!activeAuthorizingDevice) {
      throw new Error('permission denied: no permissions to approve request.');
    }
    const existingDeviceRequest = family.devices.find(
      (d) => d.deviceId === args.deviceId
    );
    if (!existingDeviceRequest) {
      throw new Error('failed to find request');
    }
    //set device to active and update the field in the db
    existingDeviceRequest.status = 'active';
    await ctx.db.patch(family._id, {
      devices: [
        ...family.devices.filter((d) => d.deviceId != args.deviceId),
        existingDeviceRequest,
      ],
    });
  },
});
