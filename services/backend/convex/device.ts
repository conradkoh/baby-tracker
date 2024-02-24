import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
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
        .filter((v) => v.eq(v.field('deviceId'), deviceId))
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
    if (device == null) {
      throw new Error('sync failed: no device.');
    }
    return device;
  },
});
