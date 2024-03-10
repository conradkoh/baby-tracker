import { GenericQueryCtx } from 'convex/server';
import { DataModel, Id } from '../../../convex/_generated/dataModel';
import { activityStreamForDevice } from './activityStreamForDevice';

export async function requireActivityAccess(
  ctx: GenericQueryCtx<DataModel>,
  args: { deviceId: string; activityId: Id<'activities'> }
) {
  const deviceActivityStream = await activityStreamForDevice(ctx, {
    deviceId: args.deviceId,
  });
  if (!deviceActivityStream) {
    throw new Error(`activity stream not found for device: ${args.deviceId}`);
  }
  const activity = await ctx.db.get(args.activityId);
  if (!activity) {
    throw new Error(`activity not found: ${args.activityId}`);
  }
  if (activity.activityStreamId !== deviceActivityStream._id) {
    throw new Error(`activity not found in device activity stream`);
  }
}
