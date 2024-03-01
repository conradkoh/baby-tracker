import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const IconButton = ({
  style,
  className = '',
  onPress = undefined,
  children,
}: Pick<
  TouchableOpacity['props'],
  'style' | 'className' | 'onPress' | 'children'
>) => {
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
