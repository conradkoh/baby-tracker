import { useCallback, useRef, useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
export function useInputModal() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [inputValue, setInputValue] = useState('');
  const resolver = useRef((result: string): void => {
    throw new Error('resolve not initialized');
  });

  const reset = useCallback(() => {
    setTitle('');
    setPlaceholder('');
    setInputValue('');
  }, []);
  const element = (
    <AlertInputModal
      visible={visible}
      title={title}
      placeholder={placeholder}
      value={inputValue}
      setValue={setInputValue}
      onClose={function (): void {
        reset();
        setVisible(false);
      }}
      onSubmit={function (result: { value: string }): void {
        resolver.current(result.value);
      }}
    />
  );
  return {
    show: async (
      title: string,
      opts: { placeholder?: string; onSubmit: (val: string) => void }
    ) => {
      setTitle(title);
      setPlaceholder(opts.placeholder || '');
      setVisible(true);
      resolver.current = opts.onSubmit;
    },
    close: () => {
      reset();
      setVisible(false);
    },
    element,
  };
}

export interface AlertInputModalProps {
  title: string;
  placeholder?: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: { value: string }) => void;
  value: string;
  setValue: (v: string) => void;
}

export const AlertInputModal = ({
  title,
  placeholder,
  visible,
  onClose,
  onSubmit,
  value,
  setValue,
}: AlertInputModalProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          className="rounded-lg w-2/3 bg-blue-200 border-blue-400"
          style={styles.modalView}
        >
          <Text className="pt-4 text-lg font-bold">{title}</Text>
          <TextInput
            className="border-2 rounded-lg border-gray-400"
            style={styles.input}
            onChangeText={setValue}
            value={value}
            placeholder={placeholder}
          />
          <View className="flex-row pb-2 px-3">
            <TouchableOpacity
              className="p-2 flex-1 mr-3 rounded-md bg-red-500"
              onPress={onClose}
            >
              <Text className="text-white text-center font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2 flex-1 rounded-md bg-blue-800"
              onPress={() => {
                onSubmit({ value });
              }}
            >
              <Text className="text-white text-center font-bold">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    // backgroundColor: 'white',
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
  input: {
    height: 40,
    margin: 12,
    // borderWidth: 1,
    padding: 10,
    width: '80%',
  },
});
