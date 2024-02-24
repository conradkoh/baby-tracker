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
  clearDevice: () => void;
}
export const useDeviceInfoStore = create<DeviceInfoStore>()(
  persist(
    (set, get) => ({
      device: {
        deviceId: uuid(),
      },
      deviceId: uuid(), //this is the source of truth for device id
      clearDevice: () => set((p) => ({ ...p, deviceId: uuid() })),
    }),
    {
      name: 'device-info-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
