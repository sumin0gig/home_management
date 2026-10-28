import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  roomDisplayName,
  useRoomStore,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
import { useTaskStore } from "../../store/useTaskStore";
import ConfirmSheet from "../../components/common/ConfirmSheet";
import { commonColor } from "../../styles/commonStyle";
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
  const removeRoom = useRoomStore( state => state.removeRoom );
  const tasks = useTaskStore( state => state.tasks );

  const [isAddingRoom, setIsAddingRoom] = React.useState( false );
  const [editingRoom, setEditingRoom] = React.useState<FloorPlanRoom | null>(
    null,
  );
  // 수정 시트에서 "방 삭제"를 누른 방. 시트를 겹치지 않도록 수정 시트를 닫고 확인 시트를 연다.
  const [deletingRoom, setDeletingRoom] = React.useState<FloorPlanRoom | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = React.useState( false );

  const deletingTaskCount = deletingRoom
    ? tasks.filter( t => t.roomId === deletingRoom.id ).length
    : 0;

  const onConfirmDelete = () => {
    if (!deletingRoom) {
      return;
    }
    setIsRemoving( true );
    return removeRoom( deletingRoom.id )
    .then( ok => ok && setDeletingRoom( null ) )
    .finally( () => setIsRemoving( false ) );
  };

  const onAddRoom = (roomType: NonNullable<RoomType>, label: string) => {
    if (!family) return Promise.resolve( false );
    return addRoom( family.id, roomType, label.trim() || undefined ).then( ok => {
      if (ok) setIsAddingRoom( false );
      return ok;
    } );
  };

  const onRoomMove = (roomId: string, x: number, y: number) =>
    updateRoomPosition( roomId, x, y );

  return (
    <View style={ styles.container }>
      { roomError ? <Text style={ styles.error }> { roomError } </Text> : null }

      <Text style={ styles.description }>
        방을 누르면 고칠 수 있고, 끌면 옮겨져요.
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
          rooms={ rooms }
          editable
          onRoomPress={ room => setEditingRoom( room ) }
          onRoomMove={ onRoomMove }
        />
      </ScrollView>

      <AddRoomModal
        visible={ isAddingRoom }
        onClose={ () => setIsAddingRoom( false ) }
        onSubmit={ onAddRoom }
      />

      {
        editingRoom
        ? <RoomEditModal
          room={ editingRoom }
          rooms={ rooms }
          onSave={ updates => updateRoomDetails( editingRoom.id, updates ) }
          onClose={ () => setEditingRoom( null ) }
          onDelete={ () => {
            setDeletingRoom( editingRoom );
            setEditingRoom( null );
          } }
        />
        : null
      }

      <ConfirmSheet
        visible={ deletingRoom !== null }
        title={
          deletingRoom ? `${roomDisplayName( deletingRoom )}을 삭제할까요?` : ""
        }
        description={
          deletingTaskCount > 0
            ? `집안일 ${deletingTaskCount}개와 완료 기록이 함께 삭제돼요.`
            : "이 방에는 집안일이 없어요."
        }
        confirmText="삭제"
        confirmTone="danger"
        isConfirming={ isRemoving }
        onConfirm={ onConfirmDelete }
        onCancel={ () => setDeletingRoom( null ) }
      />
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
} );

export default RoomEditScreen;
