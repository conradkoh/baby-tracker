import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';

export const get = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', args.deviceId))
      .first();
  },
});
export const sync = mutation({
  args: {
    deviceId: v.string(), //this must be generate on the client
    deviceName: v.optional(v.string()),
    osName: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const getDeviceByDeviceId = async (deviceId: string) => {
      return await ctx.db
        .query('device')
        .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
        .first();
    };
    const createNewDevice = async () => {
      const deviceId = args.deviceId; //get device id from params

      await ctx.db.insert('device', {
        deviceId,
        deviceName: args.deviceName,
        osName: args.osName,
        osVersion: args.osVersion,
      });

      const device = await getDeviceByDeviceId(deviceId);
      //create a new activity stream for this device
      await ctx.db.insert('activityStream', {
        type: 'device',
        device: {
          deviceId,
        },
      });
      return device;
    };
    const updateDevice = async (prevState: Doc<'device'>) => {
      if (
        args.deviceName != prevState.deviceName ||
        args.osName != prevState.osName ||
        args.osVersion != prevState.osVersion ||
        args.brand != prevState.brand
      ) {
        await ctx.db.patch(prevState._id, {
          deviceName: args.deviceName,
          osName: args.osName,
          osVersion: args.osVersion,
          brand: args.brand,
        }); //update the DB with device info
      }
      return getDeviceByDeviceId(prevState.deviceId);
    };

    let device: Doc<'device'> | null;
    if (!args.deviceId) {
      device = await createNewDevice(); //create if no id
    } else {
      const prevDeviceState = await getDeviceByDeviceId(args.deviceId);
      if (!prevDeviceState) {
        device = await createNewDevice(); //create if not found
      } else {
        device = await updateDevice(prevDeviceState);
      }
    }
    if (!device) {
      throw new Error('sync failed: no device.');
    }
    if (device.familyId) {
      //check if family is valid
      const family = await ctx.db.get(device.familyId);
      if (!family) {
        //remove device from family
        await ctx.db.patch(device._id, { familyId: undefined });
      }
    }

    //TEMP: Enforce activity streams for device and family if not found
    const deviceActivityStream = await ctx.db
      .query('activityStream')
      .withIndex('by_deviceId', (v) =>
        v.eq('device.deviceId', device?.deviceId)
      )
      .first();
    if (!deviceActivityStream) {
      await ctx.db.insert('activityStream', {
        type: 'device',
        device: {
          deviceId: device.deviceId,
        },
      });
    }
    if (device.familyId) {
      const familyActivityStream = await ctx.db
        .query('activityStream')
        .withIndex('by_familyId', (v) => v.eq('family.id', device?.familyId))
        .first();
      if (!familyActivityStream) {
        await ctx.db.insert('activityStream', {
          type: 'family',
          family: {
            id: device.familyId,
          },
        });
      }
    }
  },
});

export const getFamilyJoinRequests = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const deviceId = args.deviceId;
    if (!deviceId) {
      return [];
    }
    const requests = await ctx.db
      .query('familyJoinRequests')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .collect();
    return requests;
  },
});
