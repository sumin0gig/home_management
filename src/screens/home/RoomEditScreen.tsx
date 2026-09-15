import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  useRoomStore,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import ModalView from "../../components/common/ModalView";
import DefaultButton from "../../components/common/DefaultButton";
import FloorPlanCanvas from "../../components/FloorPlan/FloorPlanCanvas";
import RoomEditModal from "../../components/FloorPlan/RoomEditModal";

function RoomEditScreen(): React.JSX.Element {
  const family = useFamilyStore( state => state.family );
  const rooms = useRoomStore( state => state.rooms );
  const roomError = useRoomStore( state => state.error );
  const addRoom = useRoomStore( state => state.addRoom );
  const updateRoomPosition = useRoomStore( state => state.updateRoomPosition );
  const updateRoomDetails = useRoomStore( state => state.updateRoomDetails );

  const [isAddingRoom, setIsAddingRoom] = React.useState( false );
  const [editingRoom, setEditingRoom] = React.useState<FloorPlanRoom | null>(
    null,
  );
  const [pendingPositions, setPendingPositions] = React.useState<
    Record<string, { x: number; y: number }>
  >( {} );
  const [isSavingPositions, setIsSavingPositions] = React.useState( false );

  const hasPendingPositions = Object.keys( pendingPositions ).length > 0;

  // 드래그로 옮긴 위치는 여기서 바로 DB에 반영하지 않고 로컬에만 들고 있다가,
  // "위치 저장"을 눌러야 한꺼번에 반영한다.
  const effectiveRooms = rooms.map( room =>
    pendingPositions[room.id]
    ? { ...room, ...pendingPositions[room.id] }
    : room,
  );

  const onAddRoom = async (roomType: NonNullable<RoomType>, label: string) => {
    if (!family) {
      return;
    }
    await addRoom( family.id, roomType, label.trim() || undefined );
    setIsAddingRoom( false );
  };

  const onRoomMove = (roomId: string, x: number, y: number) => {
    setPendingPositions( prev => ( { ...prev, [roomId]: { x, y } } ) );
  };

  const onSavePositions = async () => {
    setIsSavingPositions( true );
    try {
      await Promise.all(
        Object.entries( pendingPositions ).map( ( [roomId, pos] ) =>
          updateRoomPosition( roomId, pos.x, pos.y ),
        ),
      );
      setPendingPositions( {} );
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSavingPositions( false );
    }
  };

  return (
    <View style={ styles.container }>
      { roomError ? <Text style={ styles.error }> { roomError } </Text> : null }

      <Text style={ styles.description }>
        방을 눌러 이름이나 종류를 바꿀 수 있어요. 방을 끌어서 위치를 옮긴 뒤
        "위치 저장"을 누르면 반영돼요.
      </Text>

      <Pressable
        style={ styles.addRoomLink }
        onPress={ () => setIsAddingRoom( true ) }
      >
        <Text style={ styles.addRoomLinkText }> + 방 추가 </Text>
      </Pressable>

      <ScrollView
        style={ styles.floorPlanScroll }
        showsVerticalScrollIndicator={ false }
      >
        <FloorPlanCanvas
          rooms={ effectiveRooms }
          editable
          onRoomPress={ room => setEditingRoom( room ) }
          onRoomMove={ onRoomMove }
        />
      </ScrollView>

      <Pressable
        style={ [
          styles.savePositionsButton,
          !hasPendingPositions && styles.savePositionsButtonDisabled,
        ] }
        onPress={ onSavePositions }
        disabled={ !hasPendingPositions || isSavingPositions }
      >
        {
          isSavingPositions
          ? <ActivityIndicator color={ colors.white } />
          : <Text style={ styles.savePositionsButtonText }> 위치 저장 </Text>
        }
      </Pressable>

      <AddRoomModal
        visible={ isAddingRoom }
        onClose={ () => setIsAddingRoom( false ) }
        onSubmit={ onAddRoom }
      />

      {
        editingRoom
        ? <RoomEditModal
          room={ editingRoom }
          rooms={ effectiveRooms }
          onSave={ updates => updateRoomDetails( editingRoom.id, updates ) }
          onClose={ () => setEditingRoom( null ) }
        />
        : null
      }
    </View>
  );
}

type AddRoomModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (roomType: NonNullable<RoomType>, label: string) => Promise<void>;
};

const AddRoomModal = ( {
  visible,
  onClose: onCloseModal,
  onSubmit: onSubmitRoom,
}: AddRoomModalProps ): React.JSX.Element => {
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
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 16,
  },
  addRoomLink: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  addRoomLinkText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  floorPlanScroll: {
    flex: 1,
  },
  savePositionsButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  savePositionsButtonDisabled: {
    backgroundColor: commonColor.border,
  },
  savePositionsButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
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

export default RoomEditScreen;
