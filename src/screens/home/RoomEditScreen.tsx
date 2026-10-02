import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFamilyStore } from "../../store/useFamilyStore";
import {
  useRoomStore,
  type FloorPlanRoom,
  type RoomType,
} from "../../store/useRoomStore";
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

  const [isAddingRoom, setIsAddingRoom] = React.useState( false );
  const [editingRoom, setEditingRoom] = React.useState<FloorPlanRoom | null>(
    null,
  );

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
        방을 눌러 이름이나 종류를 바꿀 수 있어요. 방을 끌어서 옮기면 위치가 저장돼요.
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
          removable
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
} );

export default RoomEditScreen;
