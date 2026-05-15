/**
 * Convex implementation of IFamilyRepository.
 */
import type { GenericMutationCtx, GenericDatabaseWriter } from 'convex/server';
import type { DataModel, Id, Doc } from '../../convex/_generated/dataModel';
import { transferActivitiesFromDeviceToFamily, transferActivitiesFromFamilyToDevice } from '../../domain/entities/usecase/transferActivities';
import type { IFamilyRepository } from '../domain/repositories/IFamilyRepository';
import type { Family, FamilyJoinRequest } from '../domain/family/Family';

export class ConvexFamilyRepository implements IFamilyRepository {
  constructor(private ctx: GenericMutationCtx<DataModel>) {}

  async create(deviceId: string): Promise<string> {
    const db = this.ctx.db;
    const device = await db
      .query('device')
      .filter((d) => d.eq(d.field('deviceId'), deviceId))
      .first();
    if (!device) {
      throw new Error('invalid device id');
    }

    // Create family
    const familyId = await db.insert('family', {
      children: [],
      devices: [{ deviceId }],
    });

    // Link device to family
    await db.patch(device._id, { familyId });

    // Create family activity stream
    await db.insert('activityStream', {
      type: 'family',
      family: { id: familyId },
    });

    // Transfer device activities to family
    await transferActivitiesFromDeviceToFamily(this.ctx, { familyId, deviceId });

    return familyId;
  }

  async getById(familyId: string): Promise<(Family & { joinRequests: FamilyJoinRequest[] }) | null> {
    const family = await this.ctx.db.get(familyId as Id<'family'>);
    if (!family) return null;

    const joinRequests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (v) => v.eq('familyId', familyId as Id<'family'>))
      .collect();

    return {
      ...family,
      joinRequests: joinRequests.map((r) => ({
        deviceId: r.deviceId,
        familyId: r.familyId,
        status: r.status,
      })),
    };
  }

  async delete(authorizingDeviceId: string, familyId: string): Promise<void> {
    const family = await this.ctx.db.get(familyId as Id<'family'>);
    if (!family) throw new Error('failed to get family');

    const authorizingDevice = family.devices.find(
      (d) => d.deviceId === authorizingDeviceId
    );
    if (!authorizingDevice?.deviceId) {
      throw new Error('not authorized');
    }

    // Transfer family activities to authorizing device
    await transferActivitiesFromFamilyToDevice(this.ctx, {
      familyId: familyId as Id<'family'>,
      deviceId: authorizingDeviceId,
    });

    // Delete family
    await this.ctx.db.delete(familyId as Id<'family'>);

    // Delete all pending requests
    const requests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_familyId', (v) => v.eq('familyId', familyId as Id<'family'>))
      .collect();
    await Promise.all(requests.map((r) => this.ctx.db.delete(r._id)));
  }

  async requestJoin(familyId: string, deviceId: string): Promise<{ isError: boolean; message: string }> {
    const db = this.ctx.db;
    const family = await db
      .query('family')
      .filter((v) => v.eq(v.field('_id'), familyId))
      .first();
    if (!family) {
      return { isError: true, message: 'The provided family ID does not exist' };
    }

    const device = await db
      .query('device')
      .filter((v) => v.eq(v.field('deviceId'), deviceId))
      .first();
    if (!device) throw new Error('device does not exist');

    const existingRequests = await db
      .query('familyJoinRequests')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .collect();

    // Delete requests not from this family (device can only belong to one family)
    await Promise.all(
      existingRequests
        .filter((r) => r.familyId !== familyId)
        .map((r) => db.delete(r._id))
    );

    const existing = existingRequests.find((r) => r.familyId === familyId);
    if (existing) {
      if (existing.status === 'pending') {
        return { isError: true, message: 'Your pending request has not been approved yet.' };
      }
      return { isError: true, message: 'You are already a part of this family.' };
    }

    await db.insert('familyJoinRequests', {
      deviceId,
      familyId: family._id,
      status: 'pending',
    });

    return { isError: false, message: 'Your request has been submitted and is pending approval.' };
  }

  async approveJoinRequest(familyId: string, deviceId: string, authorizingDeviceId: string): Promise<void> {
    const db = this.ctx.db;
    const family = await db
      .query('family')
      .filter((v) => v.eq(v.field('_id'), familyId))
      .first();
    if (!family) throw new Error('family does not exist.');

    const device = await db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .first();
    if (!device) throw new Error('failed to get device');

    const joinRequest = await db
      .query('familyJoinRequests')
      .withIndex('by_familyId_and_deviceId', (q) =>
        q.eq('familyId', familyId as Id<'family'>).eq('deviceId', deviceId)
      )
      .first();
    if (!joinRequest) throw new Error('failed to find request.');

    const authorizer = family.devices.find(
      (d) => d.deviceId === authorizingDeviceId
    );
    if (!authorizer) throw new Error('permission denied: no permissions to approve request.');

    // Add device to family
    await db.patch(family._id, {
      devices: [
        ...family.devices.filter((d) => d.deviceId !== deviceId),
        { deviceId },
      ],
    });

    // Set device's familyId
    await db.patch(device._id, { familyId: family._id });

    // Delete the join request
    await db.delete(joinRequest._id);

    // Transfer activities from device to family
    await transferActivitiesFromDeviceToFamily(this.ctx, {
      familyId: family._id,
      deviceId,
    });
  }

  async leave(deviceId: string, familyId: string): Promise<void> {
    const db = this.ctx.db;
    const family = await db.get(familyId as Id<'family'>);
    if (!family) throw new Error('failed to get family');

    const device = await db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .first();
    if (!device) throw new Error('failed to get device');

    // Remove device from family
    await db.patch(family._id, {
      devices: family.devices.filter((d) => d.deviceId !== deviceId),
    });

    // Unset device familyId
    await db.patch(device._id, { familyId: undefined });

    // If last member, transfer family activities to device
    const remainingDevices = family.devices.filter((d) => d.deviceId !== deviceId);
    if (remainingDevices.length === 0) {
      const deviceActivityStream = await db
        .query('activityStream')
        .withIndex('by_deviceId', (v) => v.eq('device.deviceId', deviceId))
        .first();
      const familyActivityStream = await db
        .query('activityStream')
        .withIndex('by_familyId', (v) => v.eq('family.id', family._id))
        .first();

      if (deviceActivityStream && familyActivityStream) {
        const familyActivities = await db
          .query('activities')
          .withIndex('by_activityStreamId', (v) =>
            v.eq('activityStreamId', familyActivityStream._id)
          )
          .collect();
        await Promise.all(
          familyActivities.map((a) =>
            db.patch(a._id, { activityStreamId: deviceActivityStream._id })
          )
        );
      }
    }
  }
}
