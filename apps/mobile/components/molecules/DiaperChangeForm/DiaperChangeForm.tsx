import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useEffect, useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { DateTime } from 'luxon';
import React from 'react';
import PrimaryButton from '../../atoms/Button/Primary';
import { usePage } from '../../organisms/Page';
import { Loader } from '../Loader';
import { DiaperChangeTypeLiteral } from '@workspace/domain/entities/DiaperChange';
import { useDiaperChangeStore } from '../../../storage/stores/diaper-change-store';
import DiaperChangeTypePicker from '../../atoms/DiaperChangeTypePicker/DiaperChangeTypePicker';
interface DiaperChangeFormProps {
  onSubmit: (p: DiaperChangeFormData) => Promise<void>;
  mode: 'create' | 'edit';
}
export interface DiaperChangeFormRef {
  load: (formData: DiaperChangeFormData) => void;
}

type DiaperChangeFormData = {
  type: DiaperChangeTypeLiteral;
  timestamp: DateTime;
};

export const DiaperChangeForm = forwardRef<
  DiaperChangeFormRef,
  DiaperChangeFormProps
>(({ mode, onSubmit }: DiaperChangeFormProps, ref) => {
  const [date, setDate] = useState(new Date());
  const { diaperChangeType, setDiaperChangeType } = useDiaperChangeStore();
  const [isReady, setReady] = useState(false);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const onCreateFeedPress = useCallback(() => {
    setDisableSubmit(true);
    try {
      switch (diaperChangeType) {
        default: {
          onSubmit({
            type: diaperChangeType,
            timestamp: DateTime.fromJSDate(date),
          });
          break;
        }
      }
    } catch (err) {
      setDisableSubmit(false);
      throw err;
    }
  }, [date, diaperChangeType, onSubmit]);
  useImperativeHandle(ref, () => ({
    load(formData: DiaperChangeFormData) {
      setDate(formData.timestamp.toJSDate());
      setDiaperChangeType(formData.type);

      //mark as ready
      setReady(true);
    },
  }));
  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (date) {
        setDate(date);
      }
    },
    []
  );
  //check loading
  useEffect(() => {
    if (mode === 'create') setReady(true);
  }, [mode]);
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="h-full w-full flex-1 flex-col items-center">
        <Loader loading={!isReady}>
          <>
            <View
              className="mt-2 w-1/2 rounded-lg"
              style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
            >
              <DiaperChangeTypePicker
                value={diaperChangeType}
                onChange={setDiaperChangeType}
              />
            </View>
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
          </>

          <SaveButton disabled={disableSubmit} onPress={onCreateFeedPress} />
        </Loader>
      </View>
    </TouchableWithoutFeedback>
  );
});

/**
 * Attaches the create feed button to the page
 * @returns
 */
function SaveButton({
  onPress,
  disabled,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(
      <PrimaryButton disabled={disabled} onPress={onPress} title="Save" />
    );
    return () => page.unsetBottomEl();
  }, [disabled, onPress, page]);
  return <></>;
}
