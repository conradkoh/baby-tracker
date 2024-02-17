import { FC } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';

export const TextInputWrapper: FC<{
  onPress: () => void;
  inputRef: React.RefObject<TextInput>;
  children: React.ReactNode;
}> = (props) => {
  return (
    <TouchableOpacity
      className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
      style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
      onPress={() => props.inputRef.current?.focus()}
    >
      {props.children}
    </TouchableOpacity>
  );
};
