import { useDeviceInfoStore } from '../storage/stores/device';

export function useDeviceId() {
  const { deviceId } = useDeviceInfoStore();
  return deviceId;
}
