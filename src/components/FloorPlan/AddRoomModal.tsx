import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import TemplateChoreList, {
  useTaskTemplates,
} from "../Onboarding/TemplateChoreList";

// 기본 집안일 목록에서 이 방을 가리키는 임시 id
const NEW_ROOM_ID = "new-room";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    roomType: NonNullable<RoomType>,
    label: string,
    templateIds: string[],
  ) => Promise<boolean>;
}

function AddRoomModal( {
  visible,
  onClose: onCloseModal,
  onSubmit: onSubmitRoom,
}: Props ): React.JSX.Element {
  const [newRoomType, setNewRoomType] = React.useState<NonNullable<RoomType>>(
    "GENERAL_ROOM",
  );
  const [newRoomLabel, setNewRoomLabel] = React.useState( "" );
  const [isSaving, setIsSaving] = React.useState( false );
  // 고른 종류의 기본 집안일 (종류를 바꾸면 다시 모두 선택)
  const [selected, setSelected] = React.useState<string[] | null>( null );
  const { templates, isLoading } = useTaskTemplates(
    visible ? [newRoomType] : [],
  );
  const typeTemplates = templates[newRoomType];

  React.useEffect( () => {
    setSelected( null );
  }, [newRoomType] );
  React.useEffect( () => {
    if (selected === null && typeTemplates) {
      setSelected( typeTemplates.map( t => t.id ) );
    }
  }, [selected, typeTemplates] );

  const selectedIds = selected ?? [];

  const onToggle = (_roomId: string, templateId: string) =>
    setSelected( prev => {
      const current = prev ?? [];
      return current.includes( templateId )
        ? current.filter( id => id !== templateId )
        : [...current, templateId];
    } );

  const resetForm = () => {
    setNewRoomType( "GENERAL_ROOM" );
    setNewRoomLabel( "" );
    setSelected( null );
  };

  const onClose = () => {
    resetForm();
    onCloseModal();
  };

  const onSubmit = () => {
    setIsSaving( true );
    return onSubmitRoom( newRoomType, newRoomLabel, selectedIds )
    .then( ok => ok && resetForm() )
    .finally( () => setIsSaving( false ) );
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
      <Text style={ styles.sectionLabel }> 기본 집안일 </Text>
      <ScrollView style={ styles.choreScroll } nestedScrollEnabled>
        <TemplateChoreList
          rooms={ [{ id: NEW_ROOM_ID, roomType: newRoomType, label: newRoomLabel }] }
          templates={ templates }
          selection={ { [NEW_ROOM_ID]: selectedIds } }
          onToggle={ onToggle }
        />
      </ScrollView>
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
          disabled={ isSaving || isLoading }
          accessibilityRole="button"
        >
          {
            isSaving
            ? <ActivityIndicator color={ colors.white } />
            : <Text style={ styles.saveButtonText }>
                { `추가 · 집안일 ${selectedIds.length}개` }
              </Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textMuted,
    marginBottom: 8,
  },
  choreScroll: {
    maxHeight: 260,
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
