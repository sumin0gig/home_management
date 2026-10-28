import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import HomeScreen from "../../../src/screens/home/HomeScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { useTaskStore } from "../../../src/store/useTaskStore";
import { useMascotStore, type MascotRow } from "../../../src/store/useMascotStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { FamilyRow } from "../../../src/store/useFamilyStore";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type { TaskRow } from "../../../src/store/useTaskStore";

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

const bedroom: RoomRow = {
  id: "r1",
  familyId: "f1",
  roomType: "BEDROOM",
  label: null,
  x: 0,
  y: 0,
  width: 4,
  height: 3,
} as RoomRow;

const task: TaskRow = {
  id: "c1",
  roomId: "r1",
  title: "침구 햇빛살균",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-01",
} as TaskRow;

function renderHomeScreen( navigation = createMockNavigation<"HomeMain">() ) {
  const utils = render(
    <HomeScreen navigation={ navigation } route={ {} as never } />,
  );

  const canvas = utils.queryByTestId( "floor-plan-canvas" );
  if (canvas) {
    fireEvent( canvas, "layout", {
      nativeEvent: { layout: { width: 300, height: 300 } },
    } );
  }
  return { ...utils, navigation };
}

describe( "HomeScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    // fetchRooms/fetchTasksForFamily는 마운트 시 useEffect로 호출된다. 여기서는
    // 실제 Amplify 호출 대신 테스트가 미리 seed한 rooms/tasks 상태를 그대로 두도록
    // no-op으로 막아둔다 (렌더 결과는 store 상태만으로 검증한다).
    useRoomStore.setState( { fetchRooms: jest.fn() } );
    useTaskStore.setState( { fetchTasksForFamily: jest.fn() } );
    useFamilyStore.setState( { status: "joined", family } );
  } );

  test( "방 목록을 평면도로 보여주고, 오늘 해야 할 집안일이 있으면 표시를 남긴다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useTaskStore.setState( { status: "loaded", tasks: [task] } );

    const { getByText, getByTestId } = renderHomeScreen();

    expect( getByText( "침실" ) ).toBeTruthy();
    expect( getByTestId( "due-badge-r1" ) ).toBeTruthy();
  } );

  test( "오늘 해야 할 집안일이 없으면 표시를 남기지 않는다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useTaskStore.setState( { status: "loaded", tasks: [] } );

    const { getByText, queryByTestId } = renderHomeScreen();

    expect( getByText( "침실" ) ).toBeTruthy();
    expect( queryByTestId( "due-badge-r1" ) ).toBeNull();
  } );

  test( "방을 탭하면 RoomDetail로 이동한다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useTaskStore.setState( { status: "loaded", tasks: [] } );

    const { getByText, navigation } = renderHomeScreen();
    fireEvent.press( getByText( "침실" ) );

    // 방이 하나뿐이면 마스코트는 항상 그 방에 있다.
    expect( navigation.navigate ).toHaveBeenCalledWith( "RoomDetail", {
      roomId: "r1",
      hasMascot: true,
    } );
  } );

  test( "마스코트가 있는 방에만 핀을 보여준다", () => {
    const kitchen = { ...bedroom, id: "r2", roomType: "KITCHEN", x: 4 } as RoomRow;
    useRoomStore.setState( { status: "loaded", rooms: [bedroom, kitchen] } );
    useTaskStore.setState( { status: "loaded", tasks: [] } );
    useMascotStore.setState( {
      status: "created",
      mascot: {
        id: "m1",
        userId: "u1",
        earStyle: "ROUND",
        tailStyle: "STRAIGHT",
        fillColor: null,
      } as MascotRow,
    } );

    const { queryAllByTestId } = renderHomeScreen();

    expect( queryAllByTestId( /^mascot-pin-/ ) ).toHaveLength( 1 );
  } );

  test( "방이 없으면 안내 문구를 보여준다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [] } );
    useTaskStore.setState( { status: "loaded", tasks: [] } );

    const { getByText } = renderHomeScreen();

    expect(
      getByText( "등록된 방이 없습니다. 편집에서 방을 추가해주세요." ),
    ).toBeTruthy();
  } );

  test( "편집을 탭하면 RoomEdit으로 이동한다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useTaskStore.setState( { status: "loaded", tasks: [] } );

    const { getByText, navigation } = renderHomeScreen();
    fireEvent.press( getByText( "편집" ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "RoomEdit" );
  } );

  describe( "조용한 새로고침", () => {
    function focusableNavigation() {
      const navigation = createMockNavigation<"HomeMain">();
      const focusListeners: Array<() => void> = [];
      ( navigation.addListener as jest.Mock ).mockImplementation(
        ( event: string, listener: () => void ) => {
          if (event === "focus") {
            focusListeners.push( listener );
          }
          return jest.fn();
        },
      );
      ( navigation as unknown as { isFocused: jest.Mock } ).isFocused = jest.fn( () => true );
      const focus = () => act( () => focusListeners.forEach( listener => listener() ) );
      return { navigation, focus };
    }

    let refreshTasksForFamily: jest.Mock;
    let onAppStateChange: ( state: AppStateStatus ) => void;
    let appStateSpy: jest.SpyInstance;
    beforeEach( () => {
      onAppStateChange = () => {};
      appStateSpy = jest.spyOn( AppState, "addEventListener" ).mockImplementation( ( _, listener ) => {
        onAppStateChange = listener;
        return { remove: jest.fn() } as never;
      } );
      refreshTasksForFamily = jest.fn( () => Promise.resolve() );
      useTaskStore.setState( { refreshTasksForFamily } );
      useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
      useTaskStore.setState( { status: "loaded", tasks: [task] } );
    } );

    afterEach( () => {
      appStateSpy.mockRestore();
    } );

    test( "다시 포커스되면 스피너 없이 새로고침한다", () => {
      const { navigation, focus } = focusableNavigation();
      const { getByText } = renderHomeScreen( navigation );

      focus();

      expect( refreshTasksForFamily ).toHaveBeenCalledWith( "f1" );
      expect( getByText( "침실" ) ).toBeTruthy();
    } );

    test( "첫 불러오기 중('loading')의 포커스는 새로고침을 겹쳐 부르지 않는다", () => {
      const { navigation, focus } = focusableNavigation();
      renderHomeScreen( navigation );
      act( () => useTaskStore.setState( { status: "loading" } ) );

      focus();

      expect( refreshTasksForFamily ).not.toHaveBeenCalled();
    } );

    test( "앱이 다시 활성화되면 홈이 포커스 상태일 때만 새로고침한다", () => {
      const { navigation } = focusableNavigation();
      renderHomeScreen( navigation );

      act( () => onAppStateChange( "active" ) );
      expect( refreshTasksForFamily ).toHaveBeenCalledTimes( 1 );

      ( navigation as unknown as { isFocused: jest.Mock } ).isFocused.mockReturnValue( false );
      act( () => onAppStateChange( "active" ) );
      expect( refreshTasksForFamily ).toHaveBeenCalledTimes( 1 );
    } );

    test( "당겨서 새로고침하면 새로고침하고, 새로고침 중에도 목록을 그대로 보여준다", () => {
      const { UNSAFE_getByType, getByTestId } = renderHomeScreen();
      const { RefreshControl } = jest.requireActual( "react-native" );

      act( () => UNSAFE_getByType( RefreshControl ).props.onRefresh() );
      expect( refreshTasksForFamily ).toHaveBeenCalledWith( "f1" );

      act( () => useTaskStore.setState( { isRefreshing: true } ) );
      expect( UNSAFE_getByType( RefreshControl ).props.refreshing ).toBe( true );
      expect( getByTestId( "due-badge-r1" ) ).toBeTruthy();
    } );
  } );
} );
