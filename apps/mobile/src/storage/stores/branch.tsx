import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { Branch } from '../../../branch';
interface BranchStoreState {
  branch: Branch;
  setBranch: (v: Branch) => void;
}
export const useBranch = create<BranchStoreState>()(
  persist(
    (set, get) => ({
      branch: process.env.NODE_ENV == 'development' ? Branch.Dev : Branch.Prod,
      setBranch: (v) => set(() => ({ branch: v })),
    }),
    { name: 'branch-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
