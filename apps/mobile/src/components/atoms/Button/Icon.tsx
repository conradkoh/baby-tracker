import React from 'react';
import { TouchableOpacity } from 'react-native';

const IconButton = ({
  style,
  className = '',
  onPress = undefined,
  children,
}: Partial<
  Pick<
    React.ComponentProps<typeof TouchableOpacity>,
    'style' | 'className' | 'onPress' | 'children'
  >
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
