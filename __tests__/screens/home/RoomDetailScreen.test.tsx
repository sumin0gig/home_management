import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RoomDetailScreen from "../../../src/screens/home/RoomDetailScreen";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { useChoreStore } from "../../../src/store/useChoreStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type { ChoreRow } from "../../../src/store/useChoreStore";

const mockedCompleteChore = jest.fn();

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

function renderRoomDetailScreen(
  navigation = createMockNavigation<"RoomDetail">(),
) {
  return {
    ...render(
      <RoomDetailScreen
        navigation={ navigation }
        route={ { params: { roomId: "r1" } } as never }
      />,
    ),
    navigation,
  };
}

describe( "RoomDetailScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useRoomStore.setState( { rooms: [bedroom], status: "loaded" } );
    useChoreStore.setState( {
      chores: [chore],
      status: "loaded",
      completeChore: mockedCompleteChore,
    } );
  } );

  test( "선택한 방의 집안일 목록을 보여준다", () => {
    const { getByText } = renderRoomDetailScreen();
    expect( getByText( "침구 햇빛살균" ) ).toBeTruthy();
  } );

  test( "완료 버튼을 탭하면 completeChore를 호출한다", async () => {
    mockedCompleteChore.mockResolvedValue( undefined );
    const { getByText } = renderRoomDetailScreen();
    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( mockedCompleteChore ).toHaveBeenCalledWith( chore ),
    );
  } );

  test( "집안일 추가를 탭하면 ChoreForm으로 이동한다", () => {
    const { getByText, navigation } = renderRoomDetailScreen();
    fireEvent.press( getByText( "+ 집안일 추가" ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "ChoreForm", {
      roomId: "r1",
    } );
  } );
} );
