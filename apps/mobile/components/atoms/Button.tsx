import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const Button = ({ onPress = undefined, children }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.button}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    alignItems: 'center',
    // backgroundColor: '#DDDDDD',
    borderRadius: 5, // Optional: for rounded corners
  },
});

export default Button;
