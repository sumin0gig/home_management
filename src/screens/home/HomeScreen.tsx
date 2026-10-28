import React from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
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
import { isDueByToday, toDateString } from "../../utils/date";
import { colors, commonColor } from "../../styles/commonStyle";
import FloorPlanCanvas from "../../components/FloorPlan/FloorPlanCanvas";
import HomeTaskList from "../../components/HomeTaskList/HomeTaskList";
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
  const refreshTasksForFamily = useTaskStore(
    state => state.refreshTasksForFamily,
  );
  const isRefreshing = useTaskStore( state => state.isRefreshing );

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

  // 다른 가족이 완료한 일을 반영하는 조용한 새로고침 (스피너 화면으로 바꾸지 않는다).
  const familyId = family?.id;
  const refresh = React.useCallback( () => {
    if (familyId) {
      refreshTasksForFamily( familyId );
    }
  }, [familyId, refreshTasksForFamily] );

  // 1) 화면 포커스. 첫 진입 때는 위 useEffect의 fetchTasksForFamily가 이미
  //    불러오는 중('loading')이므로 겹쳐 부르지 않는다. (마스코트 방 다시
  //    뽑기와 같은 focus 리스너 방식)
  React.useEffect( () => {
    return navigation.addListener( "focus", () => {
      if (useTaskStore.getState().status === "loaded") {
        refresh();
      }
    } );
  }, [navigation, refresh] );

  // 2) 앱이 백그라운드에서 돌아올 때. 홈이 포커스 상태일 때만.
  React.useEffect( () => {
    const subscription = AppState.addEventListener( "change", state => {
      if (state === "active" && navigation.isFocused()) {
        refresh();
      }
    } );
    return () => subscription.remove();
  }, [navigation, refresh] );

  if (roomStatus === "loading" || taskStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );

  const hasDueToday = (room: FloorPlanRoom): boolean =>
    tasks.some(
      t => t.roomId === room.id && isDueByToday( t.nextDueDate, today ),
    );

  return (
    <ScrollView
      style={ styles.root }
      contentContainerStyle={ styles.container }
      showsVerticalScrollIndicator={ false }
      // 3) 당겨서 새로고침
      refreshControl={
        <RefreshControl refreshing={ isRefreshing } onRefresh={ refresh } />
      }
    >
      { roomError && <Text style={ styles.error }> { roomError } </Text> }
      {
        taskError
        ? <View style={ styles.errorRow }>
            <Text style={ styles.errorText }> { taskError } </Text>
            <Pressable
              onPress={ refresh }
              hitSlop={ 8 }
              accessibilityRole="button"
              style={ styles.retryButton }
            >
              <Text style={ styles.retryText }> 다시 시도 </Text>
            </Pressable>
          </View>
        : null
      }

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
        : <FloorPlanCanvas
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
      }

      <HomeTaskList
        tasks={ tasks }
        rooms={ rooms }
        today={ today }
        onTaskPress={ task => navigation.navigate( "TaskSheet", { taskId: task.id } ) }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create( {
  root: {
    flex: 1,
    backgroundColor: colors.default,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.default,
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  errorText: {
    flexShrink: 1,
    color: commonColor.error,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: commonColor.touchable,
  },
  retryText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
  editLink: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  editLinkText: {
    color: commonColor.touchable,
    fontWeight: "600",
  },
} );

export default HomeScreen;
