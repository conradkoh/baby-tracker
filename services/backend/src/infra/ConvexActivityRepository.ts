/**
 * Convex implementation of IActivityRepository.
 * Uses the existing activityStreamForDevice helper to resolve device → activity stream.
 */
import type { GenericMutationCtx, GenericQueryCtx, GenericDatabaseWriter } from 'convex/server';
import type { DataModel, Id } from '../../convex/_generated/dataModel';
import { activityStreamForDevice } from '../../domain/entities/usecase/activityStreamForDevice';
import { requireActivityAccess } from '../../domain/entities/usecase/requireActivityAccess';
import type { IActivityRepository, PaginationOpts, PaginationResult } from '../domain/repositories/IActivityRepository';
import type { Activity } from '../domain/activity/Activity';

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

export class ConvexActivityRepository implements IActivityRepository {
  constructor(private ctx: Ctx) {}

  async create(deviceId: string, activity: Activity): Promise<string> {
    const stream = await activityStreamForDevice(this.ctx, { deviceId });
    if (!stream) {
      throw new Error(`activity stream not found for device: ${deviceId}`);
    }
    // MutationCtx is required for insert — safe cast since callers always provide it
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    const id = await db.insert('activities', {
      activityStreamId: stream._id,
      activity: activity as any, // domain Activity shape matches Convex activity field
    });
    return id;
  }

  async update(deviceId: string, activityId: string, activity: Activity): Promise<void> {
    await requireActivityAccess(this.ctx as GenericQueryCtx<DataModel>, {
      deviceId,
      activityId: activityId as Id<'activities'>,
    });
    const stream = await activityStreamForDevice(this.ctx, { deviceId });
    if (!stream) {
      throw new Error(`activity stream not found for device: ${deviceId}`);
    }
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    await db.replace(activityId as Id<'activities'>, {
      activityStreamId: stream._id,
      activity: activity as any,
    });
  }

  async delete(activityId: string): Promise<void> {
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    await db.delete(activityId as Id<'activities'>);
  }

  async getById(deviceId: string, activityId: string): Promise<Activity | null> {
    await requireActivityAccess(this.ctx as GenericQueryCtx<DataModel>, {
      deviceId,
      activityId: activityId as Id<'activities'>,
    });
    const doc = await this.ctx.db.get(activityId as Id<'activities'>);
    if (!doc) return null;
    return doc.activity as Activity;
  }

  async listByDeviceTimestampDesc(
    deviceId: string,
    paginationOpts: PaginationOpts
  ): Promise<PaginationResult<Activity>> {
    const stream = await activityStreamForDevice(this.ctx, { deviceId });
    if (!stream) {
      throw new Error(`activity stream not found for device: ${deviceId}`);
    }
    const result = await this.ctx.db
      .query('activities')
      .withIndex('by_activityStreamId_by_timestamp', (q) =>
        q.eq('activityStreamId', stream._id)
      )
      .order('desc')
      .paginate(paginationOpts);

    return {
      page: result.page.map((doc) => doc.activity as Activity),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  }

  async listByTimestampRange(
    deviceId: string,
    fromMs: number,
    toMs: number
  ): Promise<Activity[]> {
    const stream = await activityStreamForDevice(this.ctx, { deviceId });
    if (!stream) {
      throw new Error(`activity stream not found for device: ${deviceId}`);
    }
    const docs = await this.ctx.db
      .query('activities')
      .withIndex('by_activityStreamId_by_timestamp', (q) =>
        q
          .eq('activityStreamId', stream._id)
          .gte('activity.timestamp', fromMs)
          .lte('activity.timestamp', toMs)
      )
      .order('asc')
      .collect();

    return docs.map((doc) => doc.activity as Activity);
  }
}
