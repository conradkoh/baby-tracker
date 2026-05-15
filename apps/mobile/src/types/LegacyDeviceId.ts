/**
 * @deprecated DEPRECATED_DEVICE_SESSION — Legacy device-based session identifier.
 * This type represents the original deviceId-based identity model where a UUID
 * generated client-side serves as the sole authentication credential.
 *
 * Migration plan: Will be replaced by the upstream session/user auth system.
 * Each LegacyDeviceId will map to an anonymous user account during migration.
 *
 * @see https://github.com/conradkoh/baby-tracker/pull/5 for auth discussion
 */
export type LegacyDeviceId = string & { readonly __brand: 'LegacyDeviceId' };

/**
 * Create a LegacyDeviceId from a plain string.
 * @deprecated DEPRECATED_DEVICE_SESSION
 */
export function toLegacyDeviceId(id: string): LegacyDeviceId {
  return id as LegacyDeviceId;
}
