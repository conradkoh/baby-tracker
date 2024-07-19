import { FC, useRef } from 'react';
import { TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
export type TextInputProps = RNTextInput['props'];
export const TextInput: FC<TextInputProps> = ({ children, ...props }) => {
  const ref = useRef<RNTextInput>(null);

  return (
    // <View className="flex flex-row w-full justify-center">
    <TouchableOpacity
      className="flex flex-row flex-grow text-ceter justify-center"
      style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
      onPress={() => ref.current?.focus()}
    >
      <RNTextInput
        ref={ref}
        {...props}
        onFocus={() => {
          if (props.selectTextOnFocus) {
            const end = props.value ? props.value.length : 0;
            ref.current?.setSelection(0, end);
          }
        }}
        selectTextOnFocus={props.selectTextOnFocus}
      />
      {children}
    </TouchableOpacity>
    // </View>
  );
};
