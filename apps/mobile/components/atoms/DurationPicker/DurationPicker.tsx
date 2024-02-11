import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Duration } from 'luxon';

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
  const [selectedMinutes, setSelectedMinutes] = useState<string>('00');
  const [selectedSeconds, setSelectedSeconds] = useState<string>('00');
  useEffect(() => {
    const duration = {
      minutes: Math.floor(value.seconds / 60),
      seconds: value.seconds % 60,
    };
    setSelectedMinutes(duration.minutes.toString().padStart(2, '0'));
    setSelectedSeconds(duration.seconds.toString().padStart(2, '0'));
  }, [value.seconds]);
  const handleDurationChange = useCallback(
    (minutes: string, seconds: string): void => {
      const duration = Duration.fromObject({
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
            <Text>{`${selectedMinutes}:${selectedSeconds}`}</Text>
          </View>
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalView}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setVisible(false)}
            >
              <Text>Done</Text>
            </TouchableOpacity>
          )}
          <View className="flex-row">
            <View className="items-center w-1/2">
              <Text>Mins</Text>
              <Picker
                selectedValue={selectedMinutes}
                onValueChange={(itemValue) => {
                  setSelectedMinutes(itemValue);
                  handleDurationChange(itemValue, selectedSeconds);
                }}
                style={{ width: '50%' }}
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
            <View className="items-center w-1/2">
              <Text>Seconds</Text>
              <Picker
                selectedValue={selectedSeconds}
                onValueChange={(itemValue) => {
                  setSelectedSeconds(itemValue);
                  handleDurationChange(selectedMinutes, itemValue);
                }}
                style={{ width: '50%' }}
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
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    alignSelf: 'flex-end',
    margin: 10,
  },
  modalView: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pressableStyle: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(184, 207, 237, 255)',
  },
});

export default DurationPicker;
