import { FC, useRef } from 'react';
import { TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
export type TextInputProps = RNTextInput['props'];
export const TextInput: FC<TextInputProps> = ({
  children,
  style,
  ...props
}) => {
  const ref = useRef<RNTextInput>(null);

  return (
    <TouchableOpacity
      className="flex-row justify-center"
      style={style}
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
  );
};
