import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import ModalView from "../common/ModalView";
import { colors, commonColor } from "../../styles/commonStyle";
import DefaultButton from "../common/DefaultButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

function CustomRoomModal( {
  visible,
  onClose: onCloseProp,
  onSubmit: onSubmitProp,
}: Props ): React.JSX.Element {
  const [name, setName] = React.useState( "" );

  const resetForm = () => {
    setName( "" );
  };

  const onClose = () => {
    resetForm();
    onCloseProp();
  };

  const onSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmitProp( name.trim() );
    resetForm();
  };

  return (
    <ModalView visible={ visible } onRequestClose={ onClose }>
      <Text style={ styles.modalTitle }> 다른 방 만들기 </Text>
      <TextInput
        style={ styles.input }
        placeholder="방 이름(예: 서재)"
        value={ name }
        onChangeText={ setName }
        autoFocus
      />
      <View style={ styles.modalButtonRow }>
        <DefaultButton
          text="취소"
          onPress={ onClose }
          style={ styles.modalCancelButton }
          textStyle={ styles.modalCancelButtonText }
        />
        <Pressable
          style={ styles.modalAddButton }
          onPress={ onSubmit }
          disabled={ !name.trim() }
        >
          <Text style={ styles.modalAddButtonText }> 추가 </Text>
        </Pressable>
      </View>
    </ModalView>
  );
}

const styles = StyleSheet.create( {
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.border,
  },
  modalCancelButtonText: {
    color: colors.darkGray,
    fontWeight: "600",
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: commonColor.touchable,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalAddButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
} );

export default CustomRoomModal;
