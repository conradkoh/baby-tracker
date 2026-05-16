/**
 * Convex implementation of IDeviceRepository.
 */
import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import type { DataModel, Doc } from '../../convex/_generated/dataModel';
import type { IDeviceRepository } from '../domain/repositories/IDeviceRepository';
import type { Device } from '../domain/device/Device';
import type { FamilyJoinRequest } from '../domain/family/Family';

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

export class ConvexDeviceRepository implements IDeviceRepository {
  constructor(private ctx: Ctx) {}

  async getByDeviceId(deviceId: string): Promise<Device | null> {
    const doc = await this.ctx.db
      .query('device')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .first();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async sync(params: {
    deviceId: string;
    deviceName?: string;
    osName?: string;
    osVersion?: string;
    brand?: string;
  }): Promise<void> {
    // sync requires mutation context
    const ctx = this.ctx as GenericMutationCtx<DataModel>;
    const db = ctx.db;

    const getDeviceByDeviceId = async (deviceId: string) => {
      return await db
        .query('device')
        .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
        .first();
    };

    const createNewDevice = async () => {
      await db.insert('device', {
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        osName: params.osName,
        osVersion: params.osVersion,
      });
      await db.insert('activityStream', {
        type: 'device',
        device: { deviceId: params.deviceId },
      });
      return getDeviceByDeviceId(params.deviceId);
    };

    const updateDevice = async (prevState: Doc<'device'>) => {
      if (
        params.deviceName !== prevState.deviceName ||
        params.osName !== prevState.osName ||
        params.osVersion !== prevState.osVersion ||
        params.brand !== prevState.brand
      ) {
        await db.patch(prevState._id, {
          deviceName: params.deviceName,
          osName: params.osName,
          osVersion: params.osVersion,
          brand: params.brand,
        });
      }
      return getDeviceByDeviceId(prevState.deviceId);
    };

    let device: Doc<'device'> | null;
    if (!params.deviceId) {
      device = await createNewDevice();
    } else {
      const prevDeviceState = await getDeviceByDeviceId(params.deviceId);
      if (!prevDeviceState) {
        device = await createNewDevice();
      } else {
        device = await updateDevice(prevDeviceState);
      }
    }

    if (!device) throw new Error('sync failed: no device.');

    // Clean up invalid family reference
    if (device.familyId) {
      const family = await db.get(device.familyId);
      if (!family) {
        await db.patch(device._id, { familyId: undefined });
      }
    }

    // TEMP: Enforce activity streams
    const deviceActivityStream = await db
      .query('activityStream')
      .withIndex('by_deviceId', (v) => v.eq('device.deviceId', device!.deviceId))
      .first();
    if (!deviceActivityStream) {
      await db.insert('activityStream', {
        type: 'device',
        device: { deviceId: device!.deviceId },
      });
    }
    if (device.familyId) {
      const familyActivityStream = await db
        .query('activityStream')
        .withIndex('by_familyId', (v) => v.eq('family.id', device!.familyId))
        .first();
      if (!familyActivityStream) {
        await db.insert('activityStream', {
          type: 'family',
          family: { id: device.familyId },
        });
      }
    }
  }

  async getFamilyJoinRequests(deviceId?: string): Promise<FamilyJoinRequest[]> {
    if (!deviceId) return [];
    const requests = await this.ctx.db
      .query('familyJoinRequests')
      .withIndex('by_deviceId', (v) => v.eq('deviceId', deviceId))
      .collect();
    return requests.map((r) => ({
      deviceId: r.deviceId,
      familyId: r.familyId,
      status: r.status,
    }));
  }

  private toDomain(doc: Doc<'device'>): Device {
    return {
      deviceId: doc.deviceId,
      familyId: doc.familyId,
      deviceName: doc.deviceName,
      osName: doc.osName,
      osVersion: doc.osVersion,
      brand: doc.brand,
    };
  }
}
