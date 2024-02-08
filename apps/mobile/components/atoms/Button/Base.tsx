import React from 'react';
import { Text, StyleSheet, Pressable, PressableProps } from 'react-native';
export type BaseButtonProps = Pick<
  PressableProps,
  'onPress' | 'style' | 'className'
> & {
  title: string;
};
export default function BaseButton(props: BaseButtonProps) {
  const { style, onPress, title } = props;
  return (
    <Pressable
      className={`w-full text-center items-center py-3 px-5 rounded`}
      onPress={onPress}
      style={style}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
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
