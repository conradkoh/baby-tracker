import { Migrations } from '@convex-dev/migrations';
import { DateTime } from 'luxon';

import { components, internal } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);

/**
 * General-purpose runner to execute any migration by name.
 * Usage: npx convex run migrations:run '{fn: "migrations:myMigration"}'
 */
export const run = migrations.runner();

// ========================================
// Migration Definitions
// ========================================

/**
 * Migration: Remove deprecated session expiration fields.
 * Sets `expiresAt` and `expiresAtLabel` to undefined on all sessions.
 */
export const unsetSessionExpiration = migrations.define({
  table: 'sessions',
  migrateOne: async (_ctx, session) => {
    if (session.expiresAt !== undefined || session.expiresAtLabel !== undefined) {
      return {
        expiresAt: undefined,
        expiresAtLabel: undefined,
      };
    }
  },
});

/**
 * Migration: Set default access level for users.
 * Sets `accessLevel` to 'user' for all users where it is undefined.
 */
export const setUserAccessLevelDefault = migrations.define({
  table: 'users',
  migrateOne: async (_ctx, user) => {
    if (user.accessLevel === undefined) {
      return {
        accessLevel: 'user' as const,
      };
    }
  },
});

/**
 * Migration: Fix webapp activity timestamps that were stored in UTC due to timezone bug.
 *
 * NOTE on current UTC normalisation (as of the current codebase):
 * The CreateActivity and UpdateActivity use cases now explicitly convert timestamps
 * to UTC via ts.toUTC().toISO() before storing. This migration is a one-time fix for
 * legacy data created before that normalisation was added. All new activities are
 * stored in UTC format by the use case layer.
 *
 * Old webapp used `new Date().toISOString().slice(0, 16)` for the datetime-local input default,
 * which returned UTC time. When saved, the browser re-interpreted this UTC string as local time,
 * resulting in timestamps shifted by the user's UTC offset (e.g., 8 hours early for UTC+8 users).
 *
 * Fix: For all activities with a UTC ("Z") timestamp, add 8 hours to recover the correct
 * local time, then store with the "+08:00" offset to match the mobile app format.
 *
 * Assumes all UTC timestamps came from the webapp and that the user's timezone was UTC+8.
 * Mobile-created records already have a timezone offset and are skipped.
 */
export const fixWebappTimestampsToUtcPlus8 = migrations.define({
  table: 'activities',
  migrateOne: async (_ctx, doc) => {
    const ts = doc.activity.timestamp;
    // Skip records that already have a timezone offset (mobile-created or already migrated)
    if (!ts.endsWith('Z')) return;

    // The stored UTC time is 8 hours behind the actual local time.
    // Add 8 hours to recover the correct UTC moment, then express in UTC+8.
    const correctedTs = DateTime.fromISO(ts, { zone: 'utc' })
      .plus({ hours: 8 })
      .setZone('+08:00')
      .toISO()!;

    // Use `as any` to safely spread the union-typed activity field at runtime
    // while preserving all fields (feed, diaperChange, medical, etc.).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { activity: { ...(doc.activity as any), timestamp: correctedTs } };
  },
});


/**
 * Run all migrations in order.
 * Usage: npx convex run migrations:runAll
 */
export const runAll = migrations.runner([
  internal.migrations.unsetSessionExpiration,
  internal.migrations.setUserAccessLevelDefault,
  internal.migrations.fixWebappTimestampsToUtcPlus8,
]);

