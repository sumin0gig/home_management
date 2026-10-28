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
import { toDateString } from "../../../src/utils/date";

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
    // react-native의 jest 설정에서 AppState.addEventListener는 이미 jest.fn이라,
    // spyOn().mockRestore()를 쓰면 원래 구현까지 지워진다. 구현만 바꿨다가 되돌린다.
    const addEventListener = AppState.addEventListener as jest.Mock;
    let originalImplementation: ( ( ...args: never[] ) => unknown ) | undefined;
    beforeEach( () => {
      onAppStateChange = () => {};
      originalImplementation = addEventListener.getMockImplementation();
      addEventListener.mockImplementation( ( _: string, listener: ( state: AppStateStatus ) => void ) => {
        onAppStateChange = listener;
        return { remove: jest.fn() };
      } );
      refreshTasksForFamily = jest.fn( () => Promise.resolve() );
      useTaskStore.setState( { refreshTasksForFamily } );
      useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
      useTaskStore.setState( { status: "loaded", tasks: [task] } );
    } );

    afterEach( () => {
      addEventListener.mockImplementation( originalImplementation );
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

  describe( "할 일 목록", () => {
    function daysFromToday( days: number ): string {
      const date = new Date();
      date.setDate( date.getDate() + days );
      return toDateString( date );
    }
    function makeTask( id: string, title: string, days: number ): TaskRow {
      return { ...task, id, title, nextDueDate: daysFromToday( days ) } as TaskRow;
    }

    beforeEach( () => {
      useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    } );

    test( "기한이 섞여 있으면 '할 일'과 '이번 주'로 나누고 기한 순으로 놓는다", () => {
      useTaskStore.setState( {
        status: "loaded",
        tasks: [
          makeTask( "t10", "10일 뒤 일", 10 ),
          makeTask( "t1", "내일 일", 1 ),
          makeTask( "t0", "오늘 일", 0 ),
          makeTask( "t5", "5일 뒤 일", 5 ),
          makeTask( "t-4", "4일 지난 일", -4 ),
        ],
      } );

      const { getByText, queryByText, getAllByTestId } = renderHomeScreen();

      expect( getByText( "할 일" ) ).toBeTruthy();
      expect( getByText( "이번 주" ) ).toBeTruthy();
      expect( getAllByTestId( /^home-task-/ ).map( row => row.props.testID ) ).toEqual( [
        "home-task-t-4",
        "home-task-t0",
        "home-task-t1",
        "home-task-t5",
      ] );
      expect( queryByText( "10일 뒤 일" ) ).toBeNull();
      expect( getByText( "4일 지남" ) ).toBeTruthy();
      expect( getByText( "D-5" ) ).toBeTruthy();
      // 요약: 기한이 오늘이거나 지난 일 2개
      expect( getByText( "2" ) ).toBeTruthy();
      expect( getByText( "오늘까지 할 일" ) ).toBeTruthy();
    } );

    test( "같은 기한이면 이름 가나다순", () => {
      useTaskStore.setState( {
        status: "loaded",
        tasks: [makeTask( "b", "빨래", 0 ), makeTask( "a", "걸레질", 0 )],
      } );

      const { getAllByTestId } = renderHomeScreen();

      expect( getAllByTestId( /^home-task-/ ).map( row => row.props.testID ) ).toEqual( [
        "home-task-a",
        "home-task-b",
      ] );
    } );

    test( "행을 누르면 TaskSheet로 이동하고 completeTask는 부르지 않는다", () => {
      const completeTask = jest.fn();
      useTaskStore.setState( {
        status: "loaded",
        tasks: [makeTask( "t0", "오늘 일", 0 )],
        completeTask,
      } );

      const { getByTestId, navigation } = renderHomeScreen();
      fireEvent.press( getByTestId( "home-task-t0" ) );

      expect( navigation.navigate ).toHaveBeenCalledWith( "TaskSheet", { taskId: "t0" } );
      expect( completeTask ).not.toHaveBeenCalled();
    } );

    test( "행은 이름·방·상태를 읽어 주는 버튼이다", () => {
      useTaskStore.setState( { status: "loaded", tasks: [makeTask( "t0", "오늘 일", 0 )] } );

      const { getByTestId } = renderHomeScreen();

      expect( getByTestId( "home-task-t0" ).props.accessibilityLabel ).toBe( "오늘 일, 침실, 오늘" );
      expect( getByTestId( "home-task-t0" ).props.accessibilityHint ).toBe( "집안일 상세 열기" );
    } );

    test( "'할 일'이 0개면 빈 상태 문구를 보이고 '이번 주'는 그대로 둔다", () => {
      useTaskStore.setState( { status: "loaded", tasks: [makeTask( "t1", "내일 일", 1 )] } );

      const { getByText, queryByText } = renderHomeScreen();

      expect( getByText( "오늘 할 일을 모두 마쳤어요" ) ).toBeTruthy();
      expect( queryByText( "할 일" ) ).toBeNull();
      expect( getByText( "이번 주" ) ).toBeTruthy();
    } );

    test( "비어 있는 '이번 주' 묶음은 제목째 숨긴다", () => {
      useTaskStore.setState( { status: "loaded", tasks: [makeTask( "t0", "오늘 일", 0 )] } );

      const { queryByText } = renderHomeScreen();

      expect( queryByText( "이번 주" ) ).toBeNull();
    } );

    test( "화면 어디에도 '밀린'이라는 글자가 없다", () => {
      useTaskStore.setState( {
        status: "loaded",
        tasks: [makeTask( "t-4", "4일 지난 일", -4 ), makeTask( "t1", "내일 일", 1 )],
      } );

      const { queryAllByText, queryAllByLabelText } = renderHomeScreen();

      // 보이는 글자와 화면 읽기 라벨 모두
      expect( queryAllByText( /밀린/, { includeHiddenElements: true } ) ).toHaveLength( 0 );
      expect( queryAllByLabelText( /밀린/, { includeHiddenElements: true } ) ).toHaveLength( 0 );
    } );

    test( "오류가 나면 '다시 시도'로 조용히 새로고침한다", () => {
      const refreshTasksForFamily = jest.fn( () => Promise.resolve() );
      useTaskStore.setState( {
        status: "loaded",
        tasks: [],
        error: "집안일 목록을 불러오지 못했습니다.",
        refreshTasksForFamily,
      } );

      const { getByText } = renderHomeScreen();
      fireEvent.press( getByText( "다시 시도" ) );

      expect( refreshTasksForFamily ).toHaveBeenCalledWith( "f1" );
    } );
  } );
} );
