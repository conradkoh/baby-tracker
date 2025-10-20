import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';

const IconButton = ({
  style,
  className = '',
  onPress = undefined,
  children,
}: {
  style?: TouchableOpacityProps['style'];
  className?: string;
  onPress?: TouchableOpacityProps['onPress'];
  children: TouchableOpacityProps['children'];
}) => {
  return (
    <TouchableOpacity
      className={className}
      onPress={onPress}
      activeOpacity={0.7}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
};

export default IconButton;
