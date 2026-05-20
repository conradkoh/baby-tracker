/**
 * Web-specific IActivityRepository that resolves activities by a pre-resolved
 * activityStreamId rather than by deviceId.
 *
 * The web endpoint calls requireAuthAndFamily first to obtain activityStreamId,
 * then passes it to the constructor. This avoids repeated DB lookups inside
 * each method and keeps the repository focused on data access.
 *
 * ── Timestamp conversion ───────────────────────────────────────
 * The domain operates on epoch-ms timestamps (number). Convex stores ISO 8601
 * UTC strings (v.string()). The conversion between the two happens in this
 * layer: toStorage() maps domain → storage and convertDoc() maps storage → domain.
 * Both functions narrow the discriminated union explicitly so that TypeScript
 * can verify the shape. A minimal cast (`act.feed as any`) is needed for the
 * nested payload fields because their runtime shape matches but TypeScript's
 * inference of the Convex document type is too generic to verify statically.
 */
import type { GenericMutationCtx, GenericQueryCtx, GenericDatabaseWriter } from 'convex/server';
import type { DataModel, Id } from '../../convex/_generated/dataModel';
import type { IActivityRepository, PaginationOpts, PaginationResult } from '../domain/repositories/IActivityRepository';
import type { Activity } from '../domain/activity/Activity';
import { ConvexError } from 'convex/values';

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

/** Epoch ms → ISO 8601 UTC string for Convex storage. */
function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

/** ISO 8601 UTC string → epoch ms for the domain. */
function toMs(iso: string): number {
  return Date.parse(iso);
}

/**
 * Convert a domain Activity (epoch-ms timestamp) to the Convex storage shape
 * (ISO 8601 UTC string timestamp). Each member of the discriminated union is
 * handled explicitly so TypeScript can verify the returned shape.
 */
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

/**
 * Convert a stored Convex activity document to a domain Activity (epoch-ms timestamp).
 * The `as any` on nested payload fields is required because the Convex Doc type
 * infers the activity union generically, and TypeScript cannot statically prove
 * the payload shape matches the domain type after the timestamp field is remapped.
 * At runtime the shapes are identical — only the timestamp type differs.
 */
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

export class ConvexWebActivityRepository implements IActivityRepository {
  constructor(
    private ctx: Ctx,
    private activityStreamId: Id<'activityStream'>
  ) {}

  /** Narrow a string activity ID to the Convex Id type. */
  private actId(s: string): Id<'activities'> {
    return s as Id<'activities'>;
  }

  /** Cast ctx.db to the mutable writer interface for insert/replace/delete operations. */
  private get dbWriter(): GenericDatabaseWriter<DataModel> {
    return this.ctx.db as GenericDatabaseWriter<DataModel>;
  }

  /**
   * Create a new activity in the family's activity stream.
   * The deviceId parameter is ignored — the activity stream is already resolved.
   */
  async create(_deviceId: string, activity: Activity): Promise<string> {
    const id = await this.dbWriter.insert('activities', {
      activityStreamId: this.activityStreamId,
      activity: toStorage(activity),
    });
    return id;
  }

  /**
   * Update an existing activity. Verifies the activity belongs to this
   * repository's activity stream before allowing the update.
   */
  async update(_deviceId: string, activityId: string, activity: Activity): Promise<void> {
    const doc = await this.ctx.db.get(this.actId(activityId));
    if (!doc) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Activity not found' });
    }
    if (doc.activityStreamId !== this.activityStreamId) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to update this activity' });
    }
    await this.dbWriter.replace(this.actId(activityId), {
      activityStreamId: this.activityStreamId,
      activity: toStorage(activity),
    });
  }

  /**
   * Delete an activity by ID. Verifies the activity belongs to this
   * repository's activity stream before allowing the deletion.
   */
  async delete(activityId: string): Promise<void> {
    const doc = await this.ctx.db.get(this.actId(activityId));
    if (!doc) {
      throw new ConvexError({ code: 'NOT_FOUND', message: 'Activity not found' });
    }
    if (doc.activityStreamId !== this.activityStreamId) {
      throw new ConvexError({ code: 'FORBIDDEN', message: 'Not authorized to delete this activity' });
    }
    await this.dbWriter.delete(this.actId(activityId));
  }

  /**
   * Get a single activity by ID, scoped to this repository's activity stream.
   */
  async getById(_deviceId: string, activityId: string): Promise<Activity | null> {
    const doc = await this.ctx.db.get(this.actId(activityId));
    if (!doc) return null;
    if (doc.activityStreamId !== this.activityStreamId) return null;
    return convertDoc(doc);
  }

  /**
   * List activities for the repository's activity stream, paginated by
   * timestamp descending.
   */
  async listByDeviceTimestampDesc(
    _deviceId: string,
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
      page: result.page.map((doc) => ({ ...convertDoc(doc), _id: doc._id })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  }

  /**
   * List ALL activities in the repository's activity stream whose timestamp
   * falls within [fromMs, toMs] (inclusive, epoch ms), ordered by timestamp ascending.
   */
  async listByTimestampRange(
    _deviceId: string,
    fromMs: number,
    toMs: number
  ): Promise<Activity[]> {
    const fromIso = toIso(fromMs);
    const toIso_ = toIso(toMs);
    const docs = await this.ctx.db
      .query('activities')
      .withIndex('by_activityStreamId_by_timestamp', (q) =>
        q
          .eq('activityStreamId', this.activityStreamId)
          .gte('activity.timestamp', fromIso)
          .lte('activity.timestamp', toIso_)
      )
      .order('asc')
      .collect();

    return docs.map((doc) => convertDoc(doc));
  }
}
