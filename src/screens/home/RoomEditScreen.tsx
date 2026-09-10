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
  canResizeRoom,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { commonColor } from "../../styles/commonStyle";
import { randomRoomColor } from "../../utils/commonUtils";
import ModalView from "../../components/common/ModalView";
import DefaultButton from "../../components/common/DefaultButton";
import FloorPlanCanvas from "../../components/FloorPlan/FloorPlanCanvas";
import RoomFormFields from "../../components/FloorPlan/RoomFormFields";

function RoomEditScreen(): React.JSX.Element {
  const family = useFamilyStore( state => state.family );
  const rooms = useRoomStore( state => state.rooms );
  const roomError = useRoomStore( state => state.error );
  const addRoom = useRoomStore( state => state.addRoom );
  const updateRoomPosition = useRoomStore( state => state.updateRoomPosition );

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
        방을 눌러 이름이나 종류를 바꾸거나 삭제할 수 있어요. 방을 끌어서
        위치를 옮긴 뒤 "위치 저장"을 누르면 반영돼요.
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
          ? <ActivityIndicator color="#fff" />
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
        ? <EditRoomModal
          room={ editingRoom }
          rooms={ effectiveRooms }
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
            ? <ActivityIndicator color="#fff" />
            : <Text style={ styles.saveButtonText }> 추가 </Text>
          }
        </Pressable>
      </View>
    </ModalView>
  );
};

interface EditRoomModalProps {
  room: FloorPlanRoom;
  rooms: FloorPlanRoom[];
  onClose: () => void;
}

function EditRoomModal( {
  room,
  rooms,
  onClose,
}: EditRoomModalProps ): React.JSX.Element {
  const updateRoomDetails = useRoomStore( state => state.updateRoomDetails );
  const removeRoom = useRoomStore( state => state.removeRoom );

  const [roomType, setRoomType] = React.useState<NonNullable<RoomType>>(
    room.roomType ?? "GENERAL_ROOM",
  );
  const [label, setLabel] = React.useState( room.label ?? "" );
  const [width, setWidth] = React.useState( room.width );
  const [height, setHeight] = React.useState( room.height );
  const [color, setColor] = React.useState( room.color ?? randomRoomColor() );
  const [formError, setFormError] = React.useState<string | null>( null );
  const [isSaving, setIsSaving] = React.useState( false );
  const [isDeleting, setIsDeleting] = React.useState( false );

  const onSave = async () => {
    const siblings = rooms.filter( r => r.id !== room.id );
    const candidate = { x: room.x, y: room.y, width, height };
    if (!canResizeRoom( candidate, siblings )) {
      setFormError( "다른 방과 겹치거나 캔버스를 벗어나요." );
      return;
    }
    setFormError( null );
    setIsSaving( true );
    try {
      await updateRoomDetails( room.id, {
        roomType,
        label: label.trim(),
        width,
        height,
        color,
      } );
      onClose();
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  const onDelete = async () => {
    setIsDeleting( true );
    try {
      await removeRoom( room.id );
      onClose();
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsDeleting( false );
    }
  };

  return (
    <ModalView visible onRequestClose={ onClose }>
      <Text style={ styles.modalTitle }> 방 수정 </Text>
      <RoomFormFields
        roomType={ roomType }
        onRoomTypeChange={ setRoomType }
        label={ label }
        onLabelChange={ setLabel }
        width={ width }
        onWidthChange={ setWidth }
        height={ height }
        onHeightChange={ setHeight }
        color={ color }
        onColorChange={ setColor }
      />
      {
        formError
        ? <Text style={ styles.error }> { formError } </Text>
        : null
      }
      <View style={ styles.modalButtonRow }>
        <DefaultButton
          text="삭제"
          onPress={ onDelete }
          style={ styles.deleteButton }
          textStyle={ styles.deleteButtonText }
        />
        <Pressable
          style={ styles.saveButton }
          onPress={ onSave }
          disabled={ isSaving || isDeleting }
        >
          {
            isSaving
            ? <ActivityIndicator color="#fff" />
            : <Text style={ styles.saveButtonText }> 저장 </Text>
          }
        </Pressable>
      </View>
    </ModalView>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#666",
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
    backgroundColor: "#ccc",
  },
  savePositionsButtonText: {
    color: "#fff",
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
    borderColor: "#ccc",
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
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  chipText: {
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
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
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#555",
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.negative,
  },
  deleteButtonText: {
    color: commonColor.negative,
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
    color: "#fff",
    fontWeight: "600",
  },
} );

export default RoomEditScreen;
