import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  ROOM_TYPE_DEFAULT_DIMENSIONS,
  findNextRoomPlacement,
  useRoomStore,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import AddRoomModal from "../../components/FloorPlan/AddRoomModal";
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

  // 방 삭제는 "위치 저장"과 무관하게 즉시 DB에 반영되므로, 삭제된 방의 미저장
  // 위치가 남아 있으면 저장 시 이미 없는 row를 update하다 실패한다 — 현재 목록에
  // 남아 있는 방의 위치만 저장 대상으로 본다.
  const activePendingPositions = Object.fromEntries(
    Object.entries( pendingPositions ).filter( ( [roomId] ) =>
      rooms.some( room => room.id === roomId ),
    ),
  );
  const hasPendingPositions = Object.keys( activePendingPositions ).length > 0;

  // 드래그로 옮긴 위치는 여기서 바로 DB에 반영하지 않고 로컬에만 들고 있다가,
  // "위치 저장"을 눌러야 한꺼번에 반영한다.
  const effectiveRooms = rooms.map( room =>
    activePendingPositions[room.id]
    ? { ...room, ...activePendingPositions[room.id] }
    : room,
  );

  const onAddRoom = async (roomType: NonNullable<RoomType>, label: string) => {
    if (!family) {
      return;
    }
    // store의 자동 배치는 DB에 저장된 좌표만 보므로, 아직 저장하지 않은 드래그
    // 위치까지 반영한 화면 기준으로 자리를 정해서 넘긴다 — 그러지 않으면 방을
    // 삭제해 비운 자리로 다른 방을 옮겨둔 상태에서 새 방이 그 자리에 겹쳐 생긴다.
    const { width, height } = ROOM_TYPE_DEFAULT_DIMENSIONS[roomType];
    const position = findNextRoomPlacement( effectiveRooms, width, height );
    await addRoom( family.id, roomType, label.trim() || undefined, position );
    setIsAddingRoom( false );
  };

  const onRoomMove = (roomId: string, x: number, y: number) => {
    setPendingPositions( prev => ( { ...prev, [roomId]: { x, y } } ) );
  };

  const onSavePositions = async () => {
    setIsSavingPositions( true );
    try {
      await Promise.all(
        Object.entries( activePendingPositions ).map( ( [roomId, pos] ) =>
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
          removable
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
} );

export default RoomEditScreen;
