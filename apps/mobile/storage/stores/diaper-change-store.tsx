import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DiaperChangeType } from '../../../../core/domain/entities/DiaperChange';
interface DiaperChangeFormStoreState {
  diaperChangeType: DiaperChangeType;
  setDiaperChangeType: (v: DiaperChangeType) => void;
}
export const useDiaperChangeStore = create<DiaperChangeFormStoreState>()(
  persist(
    (set, get) => ({
      diaperChangeType: DiaperChangeType.Dirty,
      setDiaperChangeType: (diaperChangeType: DiaperChangeType) =>
        set(() => ({ diaperChangeType: diaperChangeType })),
    }),
    {
      name: 'diaper-change-form-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
