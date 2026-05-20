/**
 * Convex implementation of IActivityRepository.
 * Uses the existing activityStreamForDevice helper to resolve device → activity stream.
 *
 * ── Timestamp conversion ───────────────────────────────────────
 * The domain operates on epoch-ms timestamps (number). Convex stores ISO 8601
 * UTC strings (v.string()). The conversion happens in this layer via toStorage()
 * and convertDoc(). See ConvexWebActivityRepository for detailed docs on the
 * approach and the minimal cast needed for nested payload fields.
 */
import type { GenericMutationCtx, GenericQueryCtx, GenericDatabaseWriter } from 'convex/server';
import type { DataModel, Id } from '../../convex/_generated/dataModel';
import { activityStreamForDevice } from '../../domain/entities/usecase/activityStreamForDevice';
import { requireActivityAccess } from '../../domain/entities/usecase/requireActivityAccess';
import type { IActivityRepository, PaginationOpts, PaginationResult } from '../domain/repositories/IActivityRepository';
import type { Activity } from '../domain/activity/Activity';

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

// ── Timestamp conversion helpers ──────────────────────────────────────────────

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function toMs(iso: string): number {
  return Date.parse(iso);
}

function toStorage(activity: Activity) {
  const ts = toIso(activity.timestamp);
  if (activity.type === 'feed') {
    return { type: 'feed' as const, timestamp: ts, feed: activity.feed };
  }
  if (activity.type === 'diaper_change') {
    return { type: 'diaper_change' as const, timestamp: ts, diaperChange: activity.diaperChange };
  }
  return { type: 'medical' as const, timestamp: ts, medical: activity.medical };
}

function convertDoc(doc: {
  activity:
    | { type: 'feed'; timestamp: string; feed: unknown }
    | { type: 'diaper_change'; timestamp: string; diaperChange: unknown }
    | { type: 'medical'; timestamp: string; medical: unknown };
}): Activity {
  const act = doc.activity;
  const ts = toMs(act.timestamp);
  if (act.type === 'feed') {
    return { type: 'feed' as const, timestamp: ts, feed: act.feed as any };
  }
  if (act.type === 'diaper_change') {
    return { type: 'diaper_change' as const, timestamp: ts, diaperChange: act.diaperChange as any };
  }
  return { type: 'medical' as const, timestamp: ts, medical: act.medical as any };
}

// ── Repository ─────────────────────────────────────────────────────────────────

export class ConvexActivityRepository implements IActivityRepository {
  constructor(private ctx: Ctx) {}

  async create(deviceId: string, activity: Activity): Promise<string> {
    const stream = await activityStreamForDevice(this.ctx, { deviceId });
    if (!stream) {
      throw new Error(`activity stream not found for device: ${deviceId}`);
    }
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    const id = await db.insert('activities', {
      activityStreamId: stream._id,
      activity: toStorage(activity),
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
      activity: toStorage(activity),
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
    return convertDoc(doc);
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
      page: result.page.map((doc) => ({ ...convertDoc(doc), _id: doc._id })),
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
    const fromIso = toIso(fromMs);
    const toIso_ = toIso(toMs);
    const docs = await this.ctx.db
      .query('activities')
      .withIndex('by_activityStreamId_by_timestamp', (q) =>
        q
          .eq('activityStreamId', stream._id)
          .gte('activity.timestamp', fromIso)
          .lte('activity.timestamp', toIso_)
      )
      .order('asc')
      .collect();

    return docs.map((doc) => convertDoc(doc));
  }
}
