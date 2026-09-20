import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useRoomStore } from "../../store/useRoomStore";
import { toDateString } from "../../utils/date";
import { colors, commonColor } from "../../styles/commonStyle";
import FloorPlanCanvas from "../../components/FloorPlan/FloorPlanCanvas";
import { type FloorPlanRoom } from "../../store/useRoomStore";

type Props = NativeStackScreenProps<MainStackParamList, "HomeMain">;

function pickRandomRoomId( rooms: FloorPlanRoom[] ): string | null {
  if (rooms.length === 0) {
    return null;
  }
  return rooms[Math.floor( Math.random() * rooms.length )].id;
}

function HomeScreen( { navigation }: Props ): React.JSX.Element {
  const family = useFamilyStore( state => state.family );

  const rooms = useRoomStore( state => state.rooms );
  const roomStatus = useRoomStore( state => state.status );
  const roomError = useRoomStore( state => state.error );
  const fetchRooms = useRoomStore( state => state.fetchRooms );

  const tasks = useTaskStore( state => state.tasks );
  const taskStatus = useTaskStore( state => state.status );
  const taskError = useTaskStore( state => state.error );
  const fetchTasksForFamily = useTaskStore(
    state => state.fetchTasksForFamily,
  );

  // 마스코트가 "있는" 방 — 방 목록이 바뀌거나(불러오기 완료, 방 삭제 등)
  // 홈에 포커스될 때마다 새로 뽑는다.
  const [mascotRoomId, setMascotRoomId] = React.useState<string | null>( null );
  React.useEffect( () => {
    const rollMascotRoom = () => setMascotRoomId( pickRandomRoomId( rooms ) );
    rollMascotRoom();
    return navigation.addListener( "focus", rollMascotRoom );
  }, [navigation, rooms] );

  React.useEffect( () => {
    if (family?.id) {
      fetchRooms( family.id );
    }
  }, [family?.id, fetchRooms] );

  const roomIds = rooms.map( r => r.id ).join( "," );
  React.useEffect( () => {
    if (family?.id) {
      fetchTasksForFamily( family.id );
    }
  }, [family?.id, roomIds, fetchTasksForFamily] );

  if (roomStatus === "loading" || taskStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );

  const hasDueToday = (room: FloorPlanRoom): boolean =>
    tasks.some( t => t.roomId === room.id && t.nextDueDate <= today );

  return (
    <View style={ styles.root }>
      <View style={ styles.container }>
        { roomError && <Text style={ styles.error }> { roomError } </Text> }
        { taskError && <Text style={ styles.error }> { taskError } </Text> }

        <Pressable
          style={ styles.editLink }
          onPress={ () => navigation.navigate( "RoomEdit" ) }
        >
          <Text style={ styles.editLinkText }> 편집 </Text>
        </Pressable>

        {
          rooms.length === 0
          ? <Text style={ styles.emptySection }>
            등록된 방이 없습니다. 편집에서 방을 추가해주세요.
          </Text>
          : <ScrollView
            style={ styles.floorPlanScroll }
            showsVerticalScrollIndicator={ false }
          >
            <FloorPlanCanvas
              rooms={ rooms }
              onRoomPress={ room =>
                navigation.navigate( "RoomDetail", {
                  roomId: room.id,
                  hasMascot: room.id === mascotRoomId,
                } )
              }
              hasDueToday={ hasDueToday }
              mascotRoomId={ mascotRoomId }
            />
          </ScrollView>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  emptySection: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  editLink: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  editLinkText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  floorPlanScroll: {
    flex: 1,
  },
} );

export default HomeScreen;
