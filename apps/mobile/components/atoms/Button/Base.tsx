import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
export type BaseButtonProps = Pick<
  TouchableOpacityProps,
  'onPress' | 'style' | 'className' | 'disabled'
> & {
  title: string;
};
export default function BaseButton(props: BaseButtonProps) {
  const { style, onPress, title, disabled } = props;
  return (
    <TouchableOpacity
      disabled={disabled}
      className={`w-full text-center items-center py-3 px-5 rounded`}
      onPress={onPress}
      style={style}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
