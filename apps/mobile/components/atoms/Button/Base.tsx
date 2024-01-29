import React from 'react';
import { Text, StyleSheet, Pressable, PressableProps } from 'react-native';
import { Variant, variants } from '../../../app/styles/variants';
export type BaseButtonProps = Pick<PressableProps, 'onPress' | 'style'> & {
  variant: Variant;
  title: string;
};
export default function BaseButton(props: BaseButtonProps) {
  const { style, onPress, title, variant } = props;
  return (
    <Pressable
      className={`bg-${variants.get(
        variant
      )} w-full text-center items-center py-3 px-5 rounded`}
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
