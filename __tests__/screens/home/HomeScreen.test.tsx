import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomeScreen from "../../../src/screens/home/HomeScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { useChoreStore } from "../../../src/store/useChoreStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { FamilyRow } from "../../../src/store/useFamilyStore";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type { ChoreRow } from "../../../src/store/useChoreStore";

const mockedAddRoom = jest.fn();

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
} as RoomRow;

const chore: ChoreRow = {
  id: "c1",
  roomId: "r1",
  title: "침구 햇빛살균",
  description: null,
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-01",
} as ChoreRow;

function renderHomeScreen( navigation = createMockNavigation<"HomeMain">() ) {
  return {
    ...render( <HomeScreen navigation={ navigation } route={ {} as never } /> ),
    navigation,
  };
}

describe( "HomeScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    // fetchRooms/fetchChoresForFamily는 마운트 시 useEffect로 호출된다. 여기서는
    // 실제 Amplify 호출 대신 테스트가 미리 seed한 rooms/chores 상태를 그대로 두도록
    // no-op으로 막아둔다 (렌더 결과는 store 상태만으로 검증한다).
    useRoomStore.setState( { fetchRooms: jest.fn(), addRoom: mockedAddRoom } );
    useChoreStore.setState( { fetchChoresForFamily: jest.fn() } );
    useFamilyStore.setState( { status: "joined", family } );
  } );

  test( "방 목록을 타일로 보여주고, 오늘 해야 할 집안일이 있으면 표시를 남긴다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useChoreStore.setState( { status: "loaded", chores: [chore] } );

    const { getByText, getByTestId } = renderHomeScreen();

    expect( getByText( "침실" ) ).toBeTruthy();
    expect( getByTestId( "due-badge-r1" ) ).toBeTruthy();
  } );

  test( "오늘 해야 할 집안일이 없으면 표시를 남기지 않는다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useChoreStore.setState( { status: "loaded", chores: [] } );

    const { getByText, queryByTestId } = renderHomeScreen();

    expect( getByText( "침실" ) ).toBeTruthy();
    expect( queryByTestId( "due-badge-r1" ) ).toBeNull();
  } );

  test( "방을 탭하면 RoomDetail로 이동한다", () => {
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
    useChoreStore.setState( { status: "loaded", chores: [] } );

    const { getByText, navigation } = renderHomeScreen();
    fireEvent.press( getByText( "침실" ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "RoomDetail", {
      roomId: "r1",
    } );
  } );

  test( "+ 방 추가로 방을 만들면 addRoom을 호출한다", async () => {
    useRoomStore.setState( { status: "loaded", rooms: [] } );
    useChoreStore.setState( { status: "loaded", chores: [] } );
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText } = renderHomeScreen();

    fireEvent.press( getByText( "+ 방 추가" ) );
    fireEvent.press( getByText( "침실" ) );
    fireEvent.press( getByText( "추가" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "BEDROOM",
        "BIG",
        undefined,
      ),
    );
  } );
} );
