import AsyncStorage from '@react-native-async-storage/async-storage';
import { Doc, Id } from '@workspace/backend/convex/_generated/dataModel';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEnv } from '../../lib/env/useEnv';
import { useBranch } from './branch';
import { useActiveBranch } from '../../branch';
import * as Crypto from 'expo-crypto';
const uuid = () => Crypto.randomUUID();
interface DeviceInfoStore {
  deviceId: string; //this is the source of truth for all branches for all environments
  devices: Record<string, Doc<'device'> | null>;
  getDevice: (env: string) => Doc<'device'> | null;
  setDevice: (env: string, device: Doc<'device'>) => void;
  clearDevice: () => void;
}
export const useDeviceInfoStoreState = create<DeviceInfoStore>()(
  persist(
    (set, get) => ({
      deviceId: uuid(),
      devices: {},
      getDevice: (env: string) => get().devices[env],
      setDevice: (env: string, d: Doc<'device'>) =>
        set((p) => {
          const next = {
            ...p,
            devices: {
              ...p.devices,
              [env]: d,
            },
          };
          return next;
        }),
      clearDevice: () => set((p) => ({ ...p, deviceId: uuid(), devices: {} })),
    }),
    {
      name: 'device-info-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useDeviceInfoStore() {
  const { branch: env } = useActiveBranch();
  const store = useDeviceInfoStoreState();
  return {
    deviceId: store.deviceId,
    device: store.devices[env],
    clearDevice: () => store.clearDevice(),
    setDevice: (device: Doc<'device'>) => store.setDevice(env, device),
  };
}
