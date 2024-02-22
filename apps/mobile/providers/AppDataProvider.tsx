import { useMutation, useQuery } from 'convex/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Doc, api } from '../services/api';
import { useDeviceInfoStore } from '../storage/stores/device';
import { Id } from '@workspace/backend/convex/_generated/dataModel';
import { deviceName, osName, osVersion } from 'expo-device';
import { deepEqual } from 'expo-router/build/fork/getPathFromState';

type Device = Doc<'device'>;
type AppContextData = { device: Device | null };
const deviceInfo = Object.freeze({
  osVersion: osVersion || undefined,
  osName: osName || undefined,
  deviceName: deviceName || undefined,
});
const appDataContext = createContext<AppContextData>({
  device: null,
});
export default function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const syncDevice = useMutation(api.device.sync);
  const { device: device, setDevice } = useDeviceInfoStore();
  useEffect(() => {
    (async () => {
      const nextDevice = await syncDevice({
        deviceId: device?._id,
        ...deviceInfo,
      });
      if (!deepEqual(nextDevice, device)) {
        setDevice(nextDevice); //update device state if the params have changed
      }
      return () => {};
    })();
  }, [device, setDevice, syncDevice]);
  const appState = useMemo(() => ({ device: device }), [device]);
  return (
    <appDataContext.Provider value={appState}>
      {children}
    </appDataContext.Provider>
  );
}
