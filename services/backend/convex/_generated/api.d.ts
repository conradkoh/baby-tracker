/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as appinfo from "../appinfo.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as auth_google from "../auth/google.js";
import type * as checklists from "../checklists.js";
import type * as cleanupTasks from "../cleanupTasks.js";
import type * as crypto from "../crypto.js";
import type * as device from "../device.js";
import type * as discussions from "../discussions.js";
import type * as family from "../family.js";
import type * as migrations from "../migrations.js";
import type * as presentations from "../presentations.js";
import type * as serviceDesk from "../serviceDesk.js";
import type * as sessions from "../sessions.js";
import type * as system_auth_google from "../system/auth/google.js";
import type * as web_babyTracker_activities from "../web/babyTracker/activities.js";
import type * as web_babyTracker_family from "../web/babyTracker/family.js";
import type * as web_babyTracker_helpers from "../web/babyTracker/helpers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  appinfo: typeof appinfo;
  attendance: typeof attendance;
  auth: typeof auth;
  "auth/google": typeof auth_google;
  checklists: typeof checklists;
  cleanupTasks: typeof cleanupTasks;
  crypto: typeof crypto;
  device: typeof device;
  discussions: typeof discussions;
  family: typeof family;
  migrations: typeof migrations;
  presentations: typeof presentations;
  serviceDesk: typeof serviceDesk;
  sessions: typeof sessions;
  "system/auth/google": typeof system_auth_google;
  "web/babyTracker/activities": typeof web_babyTracker_activities;
  "web/babyTracker/family": typeof web_babyTracker_family;
  "web/babyTracker/helpers": typeof web_babyTracker_helpers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
