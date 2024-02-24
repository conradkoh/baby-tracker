import { useMutation, useQuery } from 'convex/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Doc, api } from '../services/api';
import { useDeviceInfoStore } from '../storage/stores/device';
import { deviceName, osName, osVersion } from 'expo-device';

type Device = Doc<'device'>;
type AppContextData = {
  device: Device | null;
  resetDevice: () => Promise<void>;
};
const deviceInfo = Object.freeze({
  osVersion: osVersion || undefined,
  osName: osName || undefined,
  deviceName: deviceName || undefined,
});
const appDataContext = createContext<AppContextData>({
  device: null,
  resetDevice: () => {
    throw new Error('app data context not initialized.');
  },
});
export default function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const syncDevice = useMutation(api.device.sync);
  const [device, setDevice] = useState<Device | null>(null);
  const { deviceId, clearDevice } = useDeviceInfoStore();
  useEffect(() => {
    (async () => {
      const device = await syncDevice({
        deviceId,
        ...deviceInfo,
      });
      setDevice(device);
    })();
  }, [deviceId, syncDevice]);
  const resetDevice = useCallback(async () => {
    clearDevice();
  }, [clearDevice]);

  const appState = useMemo(
    () => ({ device: device, resetDevice }),
    [device, resetDevice]
  );
  return (
    <appDataContext.Provider value={appState}>
      {children}
    </appDataContext.Provider>
  );
}

export function useDeviceInfo() {
  const ctx = useContext(appDataContext);
  return ctx;
}
