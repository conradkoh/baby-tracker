import React, {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import PrimaryButton from '../../atoms/Button/Primary';
import SelectPicker from '../../atoms/SelectPicker';
import { usePage } from '../../organisms/Page';
import { useMedicalFormStore } from '../../../storage/stores/medical-form-store';
import { TextInput } from '../../atoms/TextInput/TextInput';

// Define the types for medical activities
type ActivityType = 'temperature' | 'medicine';

type MedicalFormData =
  | {
      type: 'temperature';
      timestamp: DateTime;
      temperature: number;
    }
  | {
      type: 'medicine';
      timestamp: DateTime;
      name: string;
      unit: string;
      value: number;
    };

interface MedicalActivityFormProps {
  onSubmit: (data: MedicalFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export interface MedicalActivityFormRef {
  load: (formData: MedicalFormData) => void;
}

const MedicalActivityForm = forwardRef<
  MedicalActivityFormRef,
  MedicalActivityFormProps
>(({ onSubmit, mode }, ref) => {
  const {
    medicalType,
    setMedicalType: setActivityType,
    // temperature
    temperatureValue: temperature,
    setTemperatureValue: setTemperature,
    // medicine
    medicineName,
    medicineUnit,
    medicineValue,
    setMedicineName,
    setMedicineUnit,
    setMedicineValue,
  } = useMedicalFormStore();
  const [date, setDate] = useState(new Date());
  const [isReady, setReady] = useState(false);
  const [disableSubmit, setDisableSubmit] = useState(false);

  useImperativeHandle(ref, () => ({
    load(formData: MedicalFormData) {
      setDate(formData.timestamp.toJSDate());
      setActivityType(formData.type);
      if (formData.type === 'temperature') {
        setTemperature('' + formData.temperature);
      } else {
        setMedicineName(formData.name);
        setMedicineUnit(formData.unit);
        setMedicineValue('' + formData.value);
      }
      setReady(true);
    },
  }));

  const handleDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      const currentDate = selectedDate || date;
      setDate(currentDate);
    },
    [date]
  );

  const onCreateActivityPress = useCallback(() => {
    setDisableSubmit(true);
    try {
      switch (medicalType) {
        case 'temperature': {
          const temp = parseFloat(temperature);
          if (isNaN(temp)) {
            // show dialog
            Alert.alert('Invalid temperature');
          }
          onSubmit({
            type: 'temperature',
            timestamp: DateTime.fromJSDate(date),
            temperature: temp,
          });
          break;
        }
        case 'medicine': {
          const val = parseFloat(medicineValue);
          if (isNaN(val)) {
            // show dialog
            Alert.alert('Invalid medicine value');
          }
          onSubmit({
            type: 'medicine',
            timestamp: DateTime.fromJSDate(date),
            name: medicineName,
            unit: medicineUnit,
            value: val,
          });
          break;
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
      setDisableSubmit(false);
      return;
    }
    setDisableSubmit(false);
  }, [
    medicalType,
    onSubmit,
    date,
    temperature,
    medicineName,
    medicineUnit,
    medicineValue,
  ]);

  useEffect(() => {
    if (mode === 'create') setReady(true);
  }, [mode]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="h-full w-full flex-1 flex-col items-center">
        {isReady && (
          <>
            {/* Activity Type Picker */}
            <View
              className="mt-2 w-1/2 rounded-lg"
              style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
            >
              <SelectPicker
                options={[
                  { value: 'temperature', label: 'Temperature' },
                  { value: 'medicine', label: 'Medicine' },
                ]}
                value={medicalType}
                onChange={(v) => setActivityType(v as ActivityType)}
              />
            </View>

            {/* Date Time Picker */}
            <View
              className="mt-2 flex flex-row justify-center"
              style={{ transform: [{ scale: 0.8 }] }}
            >
              <DateTimePicker
                value={date}
                mode="datetime"
                onChange={handleDateChange}
              />
            </View>

            {/* Temperature Input */}
            {medicalType === 'temperature' ? (
              <View
                className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
              >
                <TextInput
                  keyboardType="numeric"
                  className="flex-grow text-center"
                  placeholder="Degrees"
                  value={temperature}
                  onChangeText={setTemperature}
                  selectTextOnFocus={true}
                />
                <View className="border-r border-gray-400" />
                <Text className="pl-2">°C</Text>
              </View>
            ) : (
              <>
                {/* Medicine Input */}
                <View
                  className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                >
                  <TextInput
                    className="flex-grow text-center"
                    placeholder="Medicine Name"
                    value={medicineName}
                    onChangeText={setMedicineName}
                    selectTextOnFocus={true}
                  />
                </View>
                {/* Medicine Value and Unit Input */}
                <View
                  className="mt-2 p-2 w-1/2 font-bold flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                >
                  <TextInput
                    className="text-center flex-1"
                    keyboardType="numeric"
                    placeholder="Value"
                    value={medicineValue}
                    onChangeText={setMedicineValue}
                    selectTextOnFocus={true}
                  />
                  <View className="border-r border-gray-400" />
                  <View className="flex-grow flex-1">
                    <SelectPicker
                      options={[
                        { value: 'pills', label: 'pills' },
                        { value: 'drops', label: 'drops' },
                        { value: 'ml', label: 'ml' },
                        { value: 'g', label: 'g' },
                        { value: 'mg', label: 'mg' },
                      ]}
                      value={medicineUnit}
                      onChange={setMedicineUnit}
                    />
                  </View>
                </View>
              </>
            )}
            <CreateMedicalActivityButton
              disabled={disableSubmit}
              onPress={onCreateActivityPress}
            />
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
});

interface CreateActivityButtonProps {
  onPress: () => void;
  disabled: boolean;
}

function CreateMedicalActivityButton({
  onPress,
  disabled,
}: CreateActivityButtonProps) {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(
      <View className="px-5 mt-4 w-full">
        <PrimaryButton disabled={disabled} onPress={onPress} title="Save" />
      </View>
    );
    return () => page.reset();
  }, [disabled, onPress, page]);
  return <></>;
}

export default MedicalActivityForm;
