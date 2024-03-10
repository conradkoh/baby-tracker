import { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import { DataModel, Doc, Id } from '../../../convex/_generated/dataModel';

export async function tryTransferActivitiesFromDeviceToFamily(
  ctx: GenericMutationCtx<DataModel>,
  args: { deviceId: string; familyId: Id<'family'> }
) {
  try {
    await transferActivitiesFromDeviceToFamily(ctx, args);
  } catch (e) {
    console.error('failed to transfer activities', e);
  }
}

export async function transferActivitiesFromDeviceToFamily(
  ctx: GenericMutationCtx<DataModel>,
  args: { deviceId: string; familyId: Id<'family'> }
) {
  const deviceActivityStream = await ctx.db
    .query('activityStream')
    .withIndex('by_deviceId', (v) => v.eq('device.deviceId', args.deviceId))
    .first();
  if (!deviceActivityStream) {
    throw new Error(`activity stream not found for device: ${args.deviceId}`);
  }
  const familyActivityStream = await ctx.db
    .query('activityStream')
    .withIndex('by_familyId', (v) => v.eq('family.id', args.familyId))
    .first();
  if (!familyActivityStream) {
    throw new Error('failed to get family activity stream');
  }
  const deviceActivities = await ctx.db
    .query('activities')
    .withIndex('by_activityStreamId', (v) =>
      v.eq('activityStreamId', deviceActivityStream._id)
    )
    .collect();
  await Promise.all(
    deviceActivities.map((activity) =>
      ctx.db.patch(activity._id, {
        activityStreamId: familyActivityStream._id,
      })
    )
  );
}

export async function transferActivitiesFromFamilyToDevice(
  ctx: GenericMutationCtx<DataModel>,
  args: { deviceId: string; familyId: Id<'family'> }
) {
  const deviceActivityStream = await ctx.db
    .query('activityStream')
    .withIndex('by_deviceId', (v) => v.eq('device.deviceId', args.deviceId))
    .first();
  if (!deviceActivityStream) {
    throw new Error(`activity stream not found for device: ${args.deviceId}`);
  }
  const familyActivityStream = await ctx.db
    .query('activityStream')
    .withIndex('by_familyId', (v) => v.eq('family.id', args.familyId))
    .first();
  if (!familyActivityStream) {
    throw new Error('failed to get family activity stream');
  }
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
