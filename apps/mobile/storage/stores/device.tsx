import AsyncStorage from '@react-native-async-storage/async-storage';
import { Doc, Id } from '@workspace/backend/convex/_generated/dataModel';
import { brand, osName, osVersion } from 'expo-device';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
interface DeviceInfoStore {
  device: Doc<'device'> | null;
  setDevice: (d: Doc<'device'>) => void;
}
export const useDeviceInfoStore = create<DeviceInfoStore>()(
  persist(
    (set, get) => ({
      device: null,
      setDevice: (d: Doc<'device'>) => set((p) => ({ ...p, device: d })),
    }),
    {
      name: 'device-info-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
