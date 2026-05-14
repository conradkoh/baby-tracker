import AsyncStorage from '@react-native-async-storage/async-storage';
import { Doc, Id } from '@workspace/backend/convex/_generated/dataModel';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEnv } from '../../lib/env/useEnv';
import { useBranch } from './branch';
import { useActiveBranch } from '../../../branch';
import * as Crypto from 'expo-crypto';
import { LegacyDeviceId, toLegacyDeviceId } from '../types';
const uuid = () => Crypto.randomUUID();
interface DeviceInfoStore {
  deviceId: LegacyDeviceId; // DEPRECATED_DEVICE_SESSION — this is the source of truth for all branches for all environments
  clearDevice: () => void;
}
export const useDeviceInfoStore = create<DeviceInfoStore>()(
  persist(
    (set, get) => ({
      deviceId: toLegacyDeviceId(uuid()), // DEPRECATED_DEVICE_SESSION — this is the source of truth for device id
      clearDevice: () => set((p) => ({ ...p, deviceId: toLegacyDeviceId(uuid()) })), // DEPRECATED_DEVICE_SESSION
    }),
    {
      name: 'device-info-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
