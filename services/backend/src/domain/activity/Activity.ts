/**
 * Domain entity types for baby-tracker activities.
 * Pure TypeScript — no Convex imports.
 */

// ── Feed activity payloads ──────────────────────────────────────

export interface LatchFeed {
  type: 'latch';
  duration: {
    left: { seconds?: number };
    right: { seconds?: number };
  };
}

export type BottleFeedType = 'expressed' | 'formula' | 'water';

export interface BottleFeed {
  type: BottleFeedType;
  volume: { ml: number };
}

export interface SolidsFeed {
  type: 'solids';
  description: string;
}

export type FeedPayload = LatchFeed | BottleFeed | SolidsFeed;

// ── Diaper change payload ───────────────────────────────────────

export type DiaperChangeType = 'wet' | 'dirty' | 'mixed';

export interface DiaperChangePayload {
  type: DiaperChangeType;
}

// ── Medical payloads ────────────────────────────────────────────

export interface TemperaturePayload {
  type: 'temperature';
  temperature: { value: number };
}

export interface MedicinePayload {
  type: 'medicine';
  medicine: { name: string; unit: string; value: number };
}

export type MedicalPayload = TemperaturePayload | MedicinePayload;

// ── Top-level activity union ────────────────────────────────────

export type ActivityType = 'feed' | 'diaper_change' | 'medical';

export interface FeedActivity {
  /** Epoch milliseconds (UTC). Converted to/from ISO strings by the repository layer. */
  timestamp: number;
  type: 'feed';
  feed: FeedPayload;
}

export interface DiaperChangeActivity {
  /** Epoch milliseconds (UTC). Converted to/from ISO strings by the repository layer. */
  timestamp: number;
  type: 'diaper_change';
  diaperChange: DiaperChangePayload;
}

export interface MedicalActivity {
  /** Epoch milliseconds (UTC). Converted to/from ISO strings by the repository layer. */
  timestamp: number;
  type: 'medical';
  medical: MedicalPayload;
}

/**
 * Discriminated union of all baby-tracker activity shapes.
 * Mirrors the Convex schema in `convex/schema.ts`.
 */
export type Activity = FeedActivity | DiaperChangeActivity | MedicalActivity;
