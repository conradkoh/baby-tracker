import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  MedicalType,
  MedicalTypeLiteral,
} from '@workspace/domain/entities/Medical';
interface MedicalFormStoreState {
  medicalType: MedicalType;
  setMedicalType: (v: MedicalType | MedicalTypeLiteral) => void;
  // temperature
  temperatureValue: string;
  setTemperatureValue: (v: string) => void;
  // medicine
  medicineName: string;
  medicineValue: string;
  medicineUnit: string;
  setMedicineName: (v: string) => void;
  setMedicineValue: (v: string) => void;
  setMedicineUnit: (v: string) => void;
  // others
  reset: () => void;
}

const initialState: Pick<
  MedicalFormStoreState,
  | 'medicalType'
  | 'temperatureValue'
  | 'medicineName'
  | 'medicineValue'
  | 'medicineUnit'
> = {
  medicalType: MedicalType.Temperature as MedicalType,
  // temperature
  temperatureValue: '37' as string,
  // medicine
  medicineName: '' as string,
  medicineValue: '0' as string,
  medicineUnit: 'ml' as string,
};

export const useMedicalFormStore = create<MedicalFormStoreState>()(
  persist(
    (set, get) => ({
      medicalType: MedicalType.Temperature as MedicalType,
      setMedicalType: (v: MedicalType | MedicalTypeLiteral) =>
        set(() => ({ medicalType: v as MedicalType })),
      // temperature
      temperatureValue: '37' as string,
      setTemperatureValue: (v: string) => set(() => ({ temperatureValue: v })),
      // medicine
      medicineName: '' as string,
      medicineValue: '0' as string,
      medicineUnit: 'ml' as string,
      setMedicineName: (v: string) => set(() => ({ medicineName: v })),
      setMedicineValue: (v: string) => set(() => ({ medicineValue: v })),
      setMedicineUnit: (v: string) => set(() => ({ medicineUnit: v })),
      // others
      reset: () => set(() => ({ ...initialState })),
    }),
    {
      name: 'medical-form-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
