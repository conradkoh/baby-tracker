import React, { useState } from 'react';
import {
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Modal from './Modal/Modal';
const defaultStyle = {
  backgroundColor: 'rgba(184, 207, 237, 255)',
};

function SelectPicker<T>(props: {
  value: string;
  options: {
    value: T;
    label: string;
  }[];
  onChange: (v: string) => void;
  className?: string;
  style?: ViewStyle;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <View className="w-full flex items-center rounded" style={props.style}>
        <Pressable
          className="w-full items-center"
          onPress={() => setVisible(true)}
        >
          <View className="place-self-center w-auto rounded-md p-2">
            <Text>
              {props.options.find((o) => o.value === props.value)?.label ||
                'Unknown'}
            </Text>
          </View>
        </Pressable>
      </View>
      <View className="flex-1 justify-center align-middle">
        <Modal
          visible={visible}
          onClose={() => setVisible(false)}
          onDone={() => setVisible(false)}
        >
          <Picker
            selectedValue={props.value}
            onValueChange={(itemValue) => {
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
        </Modal>
      </View>
    </>
  );
}

export default SelectPicker;
