import React from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
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
import { useWidgetInstalled } from "../../widget/useWidgetInstalled";
import { takePendingRoute } from "../../navigation/pendingNavigation";
import {
  canShowWidgetPrompt,
  markWidgetPromptShown,
  takeWidgetAddedNotice,
} from "../../widget/widgetPromptState";
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

  // 준비 완료 화면에서 "가족 초대하기"를 눌렀으면 홈 위에 초대 화면을 연다.
  React.useEffect( () => {
    if (takePendingRoute() === "AddFamilyMember") {
      navigation.navigate( "AddFamilyMember" );
    }
  }, [navigation] );

  // 위젯 설치 안내: Android, 위젯 미설치, 첫 불러오기가 끝남, 홈이 맨 위일 때.
  // 이번 실행·7일·위젯으로 열림·온보딩 조건은 canShowWidgetPrompt가 본다.
  const widgetInstalled = useWidgetInstalled( navigation );
  const isFirstLoadDone = roomStatus === "loaded" && taskStatus === "loaded";
  React.useEffect( () => {
    if (
      Platform.OS !== "android" ||
      widgetInstalled !== false ||
      !isFirstLoadDone ||
      !navigation.isFocused()
    ) {
      return;
    }
    canShowWidgetPrompt().then( ok => {
      if (ok && navigation.isFocused()) {
        markWidgetPromptShown();
        navigation.navigate( "WidgetPrompt" );
      }
    } );
  }, [widgetInstalled, isFirstLoadDone, navigation] );

  // 설치 안내에서 위젯 추가가 확인되면 홈에서 짧게 알려준다.
  const [showWidgetAdded, setShowWidgetAdded] = React.useState( false );
  React.useEffect( () => {
    return navigation.addListener( "focus", () => {
      if (takeWidgetAddedNotice()) {
        setShowWidgetAdded( true );
      }
    } );
  }, [navigation] );
  React.useEffect( () => {
    if (!showWidgetAdded) {
      return;
    }
    const timer = setTimeout( () => setShowWidgetAdded( false ), 2500 );
    return () => clearTimeout( timer );
  }, [showWidgetAdded] );

  if (roomStatus === "loading" || taskStatus === "loading") {
    return (
      <View style={ styles.centerContainer }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const today = toDateString( new Date() );

  const getDueCount = (room: FloorPlanRoom): number =>
    tasks.filter(
      t => t.roomId === room.id && isDueByToday( t.nextDueDate, today ),
    ).length;

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
      {
        showWidgetAdded
        ? <View style={ styles.notice } accessibilityLiveRegion="polite">
            <Text style={ styles.noticeText }> 위젯을 추가했어요 </Text>
          </View>
        : null
      }
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
          getDueCount={ getDueCount }
          mascotRoomId={ mascotRoomId }
        />
      }
      {
        rooms.length > 0
        ? <Text style={ styles.legend }> 숫자는 그 방의 할 일 개수 </Text>
        : null
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
  legend: {
    fontSize: 12,
    color: commonColor.textMuted,
    marginTop: 6,
    marginBottom: 20,
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
  notice: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: commonColor.textDefault,
    marginBottom: 12,
  },
  noticeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
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
