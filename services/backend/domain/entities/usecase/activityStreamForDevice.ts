import { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import { DataModel, Doc } from '../../../convex/_generated/dataModel';
/**
 * Get the activity stream for a device
 * @param ctx
 * @param args
 */
export async function activityStreamForDevice(
  ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
  args: { deviceId: string }
) {
  const device = await ctx.db
    .query('device')
    .withIndex('by_deviceId', (v) => v.eq('deviceId', args.deviceId))
    .first();
  if (!device) {
    throw new Error(`device not found: ${args.deviceId}`);
  }
  let family: Doc<'family'> | null = null;
  if (device.familyId) {
    family = await ctx.db.get(device.familyId);
  }

  let activityStream: Doc<'activityStream'> | null = null;
  if (family != null) {
    const familyId = family._id;
    //use the family's activity stream
    activityStream = await ctx.db
      .query('activityStream')
      .withIndex('by_familyId', (v) => v.eq('family.id', familyId))
      .first();
  }

  //if there is still no activity stream, attempt to use the device's activity stream
  if (activityStream == null) {
    activityStream = await ctx.db
      .query('activityStream')
      .withIndex('by_deviceId', (v) => v.eq('device.deviceId', device.deviceId))
      .first();
  }
  return activityStream;
}
