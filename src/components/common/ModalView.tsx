import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

function ModalView( {
  visible,
  onRequestClose,
  children,
}: Props ): React.JSX.Element {

  if (!visible) return <></>;
  return (
    <Modal
      visible={ visible }
      transparent
      animationType="fade"
      onRequestClose={ onRequestClose }
    >
      <View style={ styles.overlay }>
        <View style={ styles.content }> { children } </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create( {
  overlay: {
    flex: 1,
    backgroundColor: commonColor.overlay,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
  },
} );

export default ModalView;
