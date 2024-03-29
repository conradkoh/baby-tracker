import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DeviceStatus } from '../domain/entities/device/DeviceStatus';
import {
  transferActivitiesFromDeviceToFamily,
  transferActivitiesFromFamilyToDevice,
} from '../domain/entities/usecase/transferActivities';
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
      devices: [{ deviceId: args.deviceId }],
    });

    //link the device to the family
    await ctx.db.patch(device._id, {
      familyId: familyID,
    });

    //create an activity stream
    await ctx.db.insert('activityStream', {
      type: 'family',
      family: {
        id: familyID,
      },
    });

    //transfer activities from device to family
    await transferActivitiesFromDeviceToFamily(ctx, {
      familyId: familyID,
      deviceId: args.deviceId,
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
  args: { authorizingDeviceId: v.string(), familyId: v.id('family') },
  handler: async (ctx, args) => {
    //check if device belongs to family
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      throw new Error('failed to get family');
    }
    const authorizingDevice = family?.devices.find(
      (v) => v.deviceId === args.authorizingDeviceId
    );
    if (!authorizingDevice?.deviceId) {
      throw new Error('not authorized');
    }
    //transfer all family records to the authorizing device
    await transferActivitiesFromFamilyToDevice(ctx, {
      familyId: args.familyId,
      deviceId: args.authorizingDeviceId,
    });

    //delete the family record
    await ctx.db.delete(args.familyId);

    //delete all pending requests for the family
    const requests = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (v) => v.eq('familyId', family._id))
      .collect();
    await Promise.all(requests.map((r) => ctx.db.delete(r._id)));
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
    const familyJoinRequests = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', args.deviceId))
      .collect();

    //delete all requests not from this family id bc each device can only belong to one family
    await Promise.all(
      familyJoinRequests
        .filter((r) => r.familyId !== args.familyId)
        .map((req) => ctx.db.delete(req._id))
    );

    const existingDevice = familyJoinRequests.find(
      (d) => d.deviceId === args.deviceId
    );
    if (existingDevice) {
      if (existingDevice.status === DeviceStatus.Pending) {
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
    //add a join request
    await ctx.db.insert('familyJoinRequests', {
      deviceId: args.deviceId,
      familyId: family._id,
      status: DeviceStatus.Pending,
    });

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
    const device = await ctx.db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', args.deviceId))
      .first();
    if (!device) {
      throw new Error('failed to get device');
    }
    const familyJoinRequest = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId_and_deviceId', (q) =>
        q.eq('familyId', args.familyId).eq('deviceId', args.deviceId)
      )
      .first();
    if (familyJoinRequest == null) {
      throw new Error('failed to find request.');
    }
    //ensure that authorizer has permissions to grant access
    const activeAuthorizingDevice = family.devices.find(
      (d) => d.deviceId === args.authorizingDeviceId //authorizer is part of family
    );
    if (!activeAuthorizingDevice) {
      throw new Error('permission denied: no permissions to approve request.');
    }
    //add the device to the family
    await ctx.db.patch(family._id, {
      devices: [
        ...family.devices.filter((d) => d.deviceId != args.deviceId),
        { deviceId: familyJoinRequest.deviceId },
      ],
    });
    //set the device's family id
    await ctx.db.patch(device._id, { familyId: family._id });

    //delete the request
    await ctx.db.delete(familyJoinRequest._id);

    //transfer activities from device to family
    await transferActivitiesFromDeviceToFamily(ctx, {
      familyId: family._id,
      deviceId: args.deviceId,
    });
  },
});

export const leave = mutation({
  args: { deviceId: v.string(), familyId: v.id('family') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      throw new Error('failed to get family');
    }
    const device = await ctx.db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', args.deviceId))
      .first();
    if (!device) {
      throw new Error('failed to get device');
    }
    //remove device from family
    await ctx.db.patch(family._id, {
      devices: [
        ...family.devices.filter((d) => d.deviceId !== device.deviceId),
      ],
    });

    //unset device's family id
    await ctx.db.patch(device._id, { familyId: undefined });

    //if you are the last member of the family, transfer activities to the device's activity stream
    if (
      family.devices.length === 1 &&
      family.devices[0].deviceId === device.deviceId
    ) {
      const deviceActivityStream = await ctx.db
        .query('activityStream')
        .withIndex('by_deviceId', (v) =>
          v.eq('device.deviceId', device.deviceId)
        )
        .first();
      const familyActivityStream = await ctx.db
        .query('activityStream')
        .withIndex('by_familyId', (v) => v.eq('family.id', family._id))
        .first();
      if (deviceActivityStream && familyActivityStream) {
        const familyActivities = await ctx.db
          .query('activities')
          .withIndex('by_activityStreamId', (v) =>
            v.eq('activityStreamId', familyActivityStream._id)
          )
          .collect();
        await Promise.all(
          familyActivities.map((activity) =>
            ctx.db.patch(activity._id, {
              activityStreamId: deviceActivityStream._id,
            })
          )
        );
      }
    }
  },
});
