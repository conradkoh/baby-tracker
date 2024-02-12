import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Duration } from 'luxon';
import Modal from '../Modal/Modal';

interface Option {
  value: string;
  label: string;
}

interface DurationPickerProps {
  value: { seconds: number };
  onDurationChange: (duration: Duration) => void;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onDurationChange,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedHours, setSelectedHours] = useState<string>('00');
  const [selectedMinutes, setSelectedMinutes] = useState<string>('00');
  const [selectedSeconds, setSelectedSeconds] = useState<string>('00');
  useEffect(() => {
    const duration = Duration.fromObject({ seconds: value.seconds }).shiftTo(
      'hours',
      'minutes',
      'seconds'
    );
    setSelectedHours(duration.hours.toString().padStart(2, '0'));
    setSelectedMinutes(duration.minutes.toString().padStart(2, '0'));
    setSelectedSeconds(duration.seconds.toString().padStart(2, '0'));
  }, [value.seconds]);
  const handleDurationChange = useCallback(
    (hours: string, minutes: string, seconds: string): void => {
      const duration = Duration.fromObject({
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: parseInt(seconds, 10),
      });
      onDurationChange(duration);
    },
    [onDurationChange]
  );

  const generateOptions = (range: number): Option[] => {
    return Array.from({ length: range + 1 }, (_, i) => ({
      value: i.toString().padStart(2, '0'),
      label: i.toString().padStart(2, '0'),
    }));
  };

  const hourOptions = generateOptions(23);
  const minutesOptions = generateOptions(59);
  const secondsOptions = generateOptions(59);

  return (
    <>
      <View className="items-center justify-center rounded-md">
        <Pressable
          className="rounded-lg"
          onPress={() => setVisible(true)}
          style={styles.pressableStyle}
        >
          <View
            className="rounded-md"
            style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
          >
            <Text>{`${selectedHours}:${selectedMinutes}:${selectedSeconds}`}</Text>
          </View>
        </Pressable>
      </View>
      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        onDone={() => setVisible(false)}
      >
        <View className="flex-row">
          <View className="items-center w-1/3">
            <Text>Hours</Text>
            <Picker
              selectedValue={selectedHours}
              onValueChange={(itemValue) => {
                setSelectedHours(itemValue);
                handleDurationChange(
                  itemValue,
                  selectedMinutes,
                  selectedSeconds
                );
              }}
              style={{ width: '100%' }}
            >
              {hourOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </Picker>
          </View>
          <View className="items-center w-1/3">
            <Text>Mins</Text>
            <Picker
              selectedValue={selectedMinutes}
              onValueChange={(itemValue) => {
                setSelectedMinutes(itemValue);
                handleDurationChange(selectedHours, itemValue, selectedSeconds);
              }}
              style={{ width: '100%' }}
            >
              {minutesOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </Picker>
          </View>
          <View className="items-center w-1/3">
            <Text>Seconds</Text>
            <Picker
              selectedValue={selectedSeconds}
              onValueChange={(itemValue) => {
                setSelectedSeconds(itemValue);
                handleDurationChange(selectedHours, selectedMinutes, itemValue);
              }}
              style={{ width: '100%' }}
            >
              {secondsOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pressableStyle: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(184, 207, 237, 255)',
  },
});

export default DurationPicker;
