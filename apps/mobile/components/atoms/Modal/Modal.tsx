import React from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onDone: () => void;
}

const Modal: React.FC<ModalProps> = ({
  children,
  visible,
  onClose,
  onDone,
}) => {
  return (
    <>
      <RNModal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={() => onClose}
      >
        <View style={styles.modalView}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => onDone()}
            >
              <Text>Done</Text>
            </TouchableOpacity>
          )}
          {children}
        </View>
      </RNModal>
    </>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  modalView: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pressableStyle: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(184, 207, 237, 255)',
  },
});

export default Modal;
