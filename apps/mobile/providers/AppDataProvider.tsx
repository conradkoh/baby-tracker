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
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { deviceName, osName, osVersion } from 'expo-device';
import { deepEqual } from 'expo-router/build/fork/getPathFromState';

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
    throw new Error('app data context not intialized.');
  },
});
export default function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const syncDevice = useMutation(api.device.sync);
  const { device: device, setDevice, clearDevice } = useDeviceInfoStore();
  const resetDevice = useCallback(async () => {
    clearDevice();
  }, [clearDevice]);
  useEffect(() => {
    (async () => {
      const nextDevice = await syncDevice({
        deviceId: device?._id,
        ...deviceInfo,
      });
      if (!nextDevice || !device || !deepEqual(nextDevice, device)) {
        setDevice(nextDevice); //update device state if the params have changed
      }
    })();
    return () => {};
  }, [device, setDevice, syncDevice]);
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
