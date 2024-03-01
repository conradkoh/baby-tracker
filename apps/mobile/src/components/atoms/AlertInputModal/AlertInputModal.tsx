import { useCallback, useRef, useState } from 'react';
import { Modal, View, TextInput, Button, StyleSheet, Text } from 'react-native';
export function useInputModal() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const resolver = useRef((result: string): void => {
    throw new Error('resolve not initialized');
  });

  const reset = useCallback(() => {
    setTitle('');
    setPlaceholder('');
  }, []);
  const element = (
    <AlertInputModal
      visible={visible}
      title={title}
      placeholder={placeholder}
      onClose={function (): void {
        setVisible(false);
        reset();
      }}
      onSubmit={function (result: { value: string }): void {
        console.log('on submit');
        resolver.current(result.value);
      }}
    />
  );
  return {
    show: async (title: string, placeholder?: string) => {
      setTitle(title);
      setPlaceholder(placeholder || '');
      setVisible(true);
      return await new Promise<string>((resolve, reject) => {
        resolver.current = resolve;
      });
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
}

export const AlertInputModal = ({
  title,
  placeholder,
  visible,
  onClose,
  onSubmit,
}: AlertInputModalProps) => {
  const [inputValue, setInputValue] = useState('');

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Text>{title}</Text>
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            onChangeText={setInputValue}
            value={inputValue}
            placeholder={placeholder}
          />
          <Button
            title="Submit"
            onPress={() => onSubmit({ value: inputValue })}
          />
          <Button title="Cancel" onPress={onClose} />
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
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
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
    borderWidth: 1,
    padding: 10,
    width: '80%',
  },
});
