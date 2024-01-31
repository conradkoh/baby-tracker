import React, { useState } from 'react';
import { Text, SafeAreaView, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
export function DatePicker() {
  const [date, setDate] = useState(new Date(1598051730000));
  const [mode, setMode] = useState<'date'>('date');
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setShow(false);
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  return (
    <SafeAreaView>
      <Button onPress={showDatepicker} title="Show date picker!" />
      <Button onPress={showTimepicker} title="Show time picker!" />
      <Text>selected: {date.toLocaleString()}</Text>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          onChange={onChange}
        />
      )}
      {/* <DateTimePicker
        testID="dateTimePicker"
        value={date}
        mode={'datetime'}
        // is24Hour={true}
        onChange={onChange}
      /> */}
    </SafeAreaView>
  );
}
