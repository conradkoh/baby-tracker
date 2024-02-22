import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
export const sync = mutation({
  args: {
    deviceId: v.optional(v.id('device')),
    deviceName: v.optional(v.string()),
    osName: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const getDeviceById = async (deviceId: Id<'device'>) => {
      return await ctx.db
        .query('device')
        .filter((v) => v.eq(v.field('_id'), deviceId))
        .first();
    };
    const createNewDevice = async () => {
      const id = await ctx.db.insert('device', {
        deviceName: args.deviceName,
        osName: args.osName,
        osVersion: args.osVersion,
      });
      const device = await getDeviceById(id);
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
      return getDeviceById(prevState._id);
    };

    let device: Doc<'device'> | null;
    if (!args.deviceId) {
      device = await createNewDevice(); //create if no id
    } else {
      const prevDeviceState = await getDeviceById(args.deviceId);
      console.log({ args, prevDeviceState });
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
