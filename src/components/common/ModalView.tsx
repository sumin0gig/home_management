import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { colors } from '../../styles/commonStyle';

interface Props {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

function ModalView({ visible, onRequestClose, children }: Props): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.modalBackground,
    borderRadius: 12,
    padding: 20,
  },
});

export default ModalView;
