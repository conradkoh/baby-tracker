import { useDeviceInfoStore } from '../storage/stores/device';
import { LegacyDeviceId } from '../types';

/** @deprecated DEPRECATED_DEVICE_SESSION — Use the upstream session/user auth system instead. */
export function useDeviceId(): LegacyDeviceId {
  const { deviceId } = useDeviceInfoStore(); // DEPRECATED_DEVICE_SESSION
  return deviceId;
}
