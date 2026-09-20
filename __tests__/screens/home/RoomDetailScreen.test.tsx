import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PlusIcon from "bootstrap-icons/icons/plus-lg.svg";
import RoomDetailScreen from "../../../src/screens/home/RoomDetailScreen";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { useTaskStore } from "../../../src/store/useTaskStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type { TaskRow } from "../../../src/store/useTaskStore";

const bedroom: RoomRow = {
  id: "r1",
  familyId: "f1",
  roomType: "BEDROOM",
  label: null,
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
    useTaskStore.setState( {
      tasks: [task],
      status: "loaded",
    } );
  } );

  test( "선택한 방의 집안일 목록을 보여준다", () => {
    const { getByText } = renderRoomDetailScreen();
    expect( getByText( "침구 햇빛살균" ) ).toBeTruthy();
  } );

  test( "집안일 추가를 탭하면 TaskForm으로 이동한다", () => {
    const { UNSAFE_getByType, navigation } = renderRoomDetailScreen();
    // 추가 버튼은 텍스트 없이 Plus 아이콘만 있다. 테스트에서는 모든 svg가 같은
    // SvgMock으로 대체되고, 이 화면의 아이콘은 추가 버튼 하나뿐이다.
    fireEvent.press( UNSAFE_getByType( PlusIcon ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "TaskForm", {
      roomId: "r1",
    } );
  } );

  test( "집안일 항목을 탭하면 TaskDetail로 이동한다", () => {
    const { getByText, navigation } = renderRoomDetailScreen();
    fireEvent.press( getByText( "침구 햇빛살균" ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "TaskDetail", {
      taskId: "c1",
    } );
  } );
} );
