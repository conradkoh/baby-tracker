/**
 * Web-specific IActivityRepository that resolves activities by a pre-resolved
 * activityStreamId rather than by deviceId.
 *
 * The web endpoint calls requireAuthAndFamily first to obtain activityStreamId,
 * then passes it to the constructor. This avoids repeated DB lookups inside
 * each method and keeps the repository focused on data access.
 */
import type { GenericMutationCtx, GenericQueryCtx, GenericDatabaseWriter } from 'convex/server';
import type { DataModel, Doc, Id } from '../../convex/_generated/dataModel';
import type { IActivityRepository, PaginationOpts, PaginationResult } from '../domain/repositories/IActivityRepository';
import type { Activity } from '../domain/activity/Activity';
import { ConvexError } from 'convex/values';

type ActivityField = Doc<'activities'>['activity'];

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

export class ConvexWebActivityRepository implements IActivityRepository {
  constructor(
    private ctx: Ctx,
    private activityStreamId: Id<'activityStream'>
  ) {}

  /**
   * Create a new activity in the family's activity stream.
   * The deviceId parameter is ignored — the activity stream is already resolved.
   */
  async create(deviceId: string, activity: Activity): Promise<string> {
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    const id = await db.insert('activities', {
      activityStreamId: this.activityStreamId,
      activity: activity,
    });
    return id;
  }

  /**
   * Update an existing activity. Verifies the activity belongs to this
   * repository's activity stream before allowing the update.
   */
  async update(deviceId: string, activityId: string, activity: Activity): Promise<void> {
    const doc = await this.ctx.db.get(activityId as Id<'activities'>);
    if (!doc) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Activity not found' });
    }
    if (doc.activityStreamId !== this.activityStreamId) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to update this activity' });
    }
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    await db.replace(activityId as Id<'activities'>, {
      activityStreamId: this.activityStreamId,
      activity: activity,
    });
  }

  /**
   * Delete an activity by ID. Verifies the activity belongs to this
   * repository's activity stream before allowing the deletion.
   *
   * @throws ConvexError({ code: 'NOT_FOUND' }) if the activity does not exist
   * @throws ConvexError({ code: 'FORBIDDEN' }) if the activity belongs to a different stream
   */
  async delete(activityId: string): Promise<void> {
    const doc = await this.ctx.db.get(activityId as Id<'activities'>);
    if (!doc) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Activity not found' });
    }
    if (doc.activityStreamId !== this.activityStreamId) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to delete this activity' });
    }
    const db = this.ctx.db as GenericDatabaseWriter<DataModel>;
    await db.delete(activityId as Id<'activities'>);
  }

  /**
   * Get a single activity by ID, scoped to this repository's activity stream.
   * Returns null if the activity doesn't exist or belongs to a different stream.
   */
  async getById(deviceId: string, activityId: string): Promise<Activity | null> {
    const doc = await this.ctx.db.get(activityId as Id<'activities'>);
    if (!doc) return null;
    if (doc.activityStreamId !== this.activityStreamId) return null;
    return doc.activity;
  }

  /**
   * List activities for the repository's activity stream, paginated by
   * timestamp descending.
   */
  async listByDeviceTimestampDesc(
    deviceId: string,
    paginationOpts: PaginationOpts
  ): Promise<PaginationResult<Activity>> {
    const result = await this.ctx.db
      .query('activities')
      .withIndex('by_activityStreamId_by_timestamp', (q) =>
        q.eq('activityStreamId', this.activityStreamId)
      )
      .order('desc')
      .paginate(paginationOpts);

    return {
      page: result.page.map((doc) => doc.activity),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  }
}
