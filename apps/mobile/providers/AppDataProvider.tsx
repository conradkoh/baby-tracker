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
import { useMount } from 'react-use';

type Device = Doc<'device'>;
type AppContextData = {
  device: Device | null | undefined;
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
  const { deviceId, clearDevice } = useDeviceInfoStore();
  const device = useQuery(api.device.get, { deviceId });
  useEffect(() => {
    (async () => {
      //sync device when info from the store changes
      await syncDevice({
        deviceId,
        ...deviceInfo,
      });
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
