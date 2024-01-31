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
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
const viewValues = new Map([
  ['expressed', 'Expressed'],
  ['latch', 'Latch'],
  ['formula', 'Formula'],
]);
const FeedPicker = (props: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [visible, setVisible] = useState(false);
  // const [selectedValue, setSelectedValue] = useState('expressed');

  return (
    <>
      <View className="w-full flex items-center rounded">
        <View
          className=" place-self-center w-auto rounded-md p-2"
          style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
        >
          <Pressable onPress={() => setVisible(true)}>
            <Text>{viewValues.get(props.value)}</Text>
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
              onValueChange={(itemValue) => props.onChange(itemValue)}
              style={{ width: '100%' }}
            >
              <Picker.Item
                label={viewValues.get('expressed')}
                value="expressed"
              />
              <Picker.Item label={viewValues.get('formula')} value="formula" />
              <Picker.Item label={viewValues.get('latch')} value="latch" />
            </Picker>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    alignSelf: 'flex-end',
    margin: 10,
  },
});

export default FeedPicker;
