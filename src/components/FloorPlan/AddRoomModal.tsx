import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  type RoomType,
} from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import ModalView from "../common/ModalView";
import DefaultButton from "../common/DefaultButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (roomType: NonNullable<RoomType>, label: string) => Promise<void>;
}

function AddRoomModal( {
  visible,
  onClose: onCloseModal,
  onSubmit: onSubmitRoom,
}: Props ): React.JSX.Element {
  const [newRoomType, setNewRoomType] =
    React.useState<NonNullable<RoomType> | null>( null );
  const [newRoomLabel, setNewRoomLabel] = React.useState( "" );
  const [isSaving, setIsSaving] = React.useState( false );

  const resetForm = () => {
    setNewRoomType( null );
    setNewRoomLabel( "" );
  };

  const onClose = () => {
    resetForm();
    onCloseModal();
  };

  const onSubmit = async () => {
    if (!newRoomType) {
      return;
    }
    setIsSaving( true );
    try {
      await onSubmitRoom( newRoomType, newRoomLabel );
      resetForm();
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <ModalView visible={ visible } onRequestClose={ onClose }>
      <Text style={ styles.modalTitle }> 방 추가 </Text>
      <View style={ styles.chipRow }>
        { ROOM_TYPES.map( roomType => (
          <Pressable
            key={ roomType }
            style={ [
              styles.chip,
              newRoomType === roomType && styles.chipSelected,
            ] }
            onPress={ () => setNewRoomType( roomType ) }
          >
            <Text
              style={
                newRoomType === roomType
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              { ROOM_TYPE_LABELS[roomType] }
            </Text>
          </Pressable>
        ) ) }
      </View>
      <TextInput
        style={ styles.input }
        placeholder="이름(선택, 예: 안방)"
        value={ newRoomLabel }
        onChangeText={ setNewRoomLabel }
      />
      <View style={ styles.modalButtonRow }>
        <DefaultButton
          text="취소"
          onPress={ onClose }
          style={ styles.cancelButton }
          textStyle={ styles.cancelButtonText }
        />
        <Pressable
          style={ styles.saveButton }
          onPress={ onSubmit }
          disabled={ isSaving || !newRoomType }
        >
          {
            isSaving
            ? <ActivityIndicator color={ colors.white } />
            : <Text style={ styles.saveButtonText }> 추가 </Text>
          }
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  chipText: {
    color: colors.darkGray,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.border,
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: commonColor.touchable,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
} );

export default AddRoomModal;
