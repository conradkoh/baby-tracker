import React from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  TouchableWithoutFeedback,
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
        <TouchableWithoutFeedback onPress={(e) => onDone()}>
          <View style={styles.modalOverlay}>
            {/* This intercepts the event from triggering the outer TouchableWithoutFeedback */}
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    className="z-10"
                    style={styles.doneButton}
                    onPress={() => onDone()}
                  >
                    <Text>Done</Text>
                  </TouchableOpacity>
                )}
                {children}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    </>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
