import React, { useState } from 'react';
import {
  View,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

function SelectPicker<T>(props: {
  value: string;
  options: {
    value: T;
    label: string;
  }[];
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <View className="w-full flex items-center rounded">
        <View
          className=" place-self-center w-auto rounded-md p-2"
          style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
        >
          <Pressable onPress={() => setVisible(true)}>
            <Text>
              {props.options.find((o) => o.value === props.value)?.label ||
                'Unknown'}
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="flex-1 justify-center align-middle">
        <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <View className="absolute bottom-0 w-full bg-slate-50 rounded-t-lg px-2 py-1 align-middle justify-center">
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setVisible(false)}
              >
                <Text>Done</Text>
              </TouchableOpacity>
            )}
            <Picker
              selectedValue={props.value}
              onValueChange={(itemValue) => {
                console.log({ itemValue });
                return props.onChange(itemValue);
              }}
              style={{ width: '100%' }}
            >
              {props.options.map((o, idx) => (
                <Picker.Item
                  key={`${o.value}+${idx}`}
                  value={o.value}
                  label={o.label}
                />
              ))}
            </Picker>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  doneButton: {
    alignSelf: 'flex-end',
    margin: 10,
  },
});

export default SelectPicker;
