import React from "react";
import {
  act,
  render,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import FloorPlanCanvas from "../../../src/components/FloorPlan/FloorPlanCanvas";
import RoomEditScreen from "../../../src/screens/home/RoomEditScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import type { FamilyRow } from "../../../src/store/useFamilyStore";
import type { RoomRow } from "../../../src/store/useRoomStore";
import { useTaskStore, type TaskRow } from "../../../src/store/useTaskStore";

const mockedAddRoom = jest.fn();
const mockedUpdateRoomDetails = jest.fn();
const mockedUpdateRoomPosition = jest.fn();
const mockedRemoveRoom = jest.fn();

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

// 드래그 제스처 자체는 DraggableRoomBlock 몫이므로, 여기서는 드래그가 끝났을 때
// 캔버스가 부모에게 알려주는 onRoomMove를 직접 호출한다.
async function moveRoom(
  utils: ReturnType<typeof renderRoomEdit>,
  roomId: string,
  x: number,
  y: number,
) {
  const canvas = utils.UNSAFE_getByType( FloorPlanCanvas );
  await act( async () => {
    await canvas.props.onRoomMove( roomId, x, y );
  } );
}

// FloorPlanCanvas는 실제 너비를 알기 전(onLayout 전)에는 방을 그리지 않으므로,
// 렌더 직후 캔버스에 layout 이벤트를 보내 방 타일이 나타나게 한다.
function renderRoomEdit() {
  const utils = render( <RoomEditScreen /> );
  fireEvent( utils.getByTestId( "floor-plan-canvas" ), "layout", {
    nativeEvent: { layout: { width: 300, height: 300 } },
  } );
  return utils;
}

describe( "RoomEditScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState( { status: "joined", family } );
    useRoomStore.setState( {
      status: "loaded",
      rooms: [bedroom],
      addRoom: mockedAddRoom,
      updateRoomDetails: mockedUpdateRoomDetails,
      updateRoomPosition: mockedUpdateRoomPosition,
      removeRoom: mockedRemoveRoom,
    } );
  } );

  test( "+ 방 추가로 방을 만들면 addRoom이 호출된다", async () => {
    mockedAddRoom.mockResolvedValue( true );

    const { getByText } = renderRoomEdit();
    fireEvent.press( getByText( "+ 방 추가" ) );
    fireEvent.press( getByText( "거실" ) );
    fireEvent.press( getByText( "추가" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "LIVING_ROOM",
        undefined,
      ),
    );
  } );

  test( "방을 끌어서 옮기면 저장 버튼 없이 바로 updateRoomPosition이 호출된다", async () => {
    mockedUpdateRoomPosition.mockResolvedValue( true );

    const utils = renderRoomEdit();
    await moveRoom( utils, "r1", 5, 2 );

    expect( mockedUpdateRoomPosition ).toHaveBeenCalledWith( "r1", 5, 2 );
    expect( utils.queryByText( "위치 저장" ) ).toBeNull();
  } );

  test( "위치 저장이 실패해도 드래그 처리가 에러를 밖으로 던지지 않는다", async () => {
    mockedUpdateRoomPosition.mockResolvedValue( false );

    const utils = renderRoomEdit();

    await expect( moveRoom( utils, "r1", 5, 2 ) ).resolves.toBeUndefined();
  } );

  test( "방을 탭하면 수정 모달이 열리고 저장하면 updateRoomDetails가 호출된다", async () => {
    mockedUpdateRoomDetails.mockResolvedValue( true );

    const { getByText, getByPlaceholderText } = renderRoomEdit();
    fireEvent.press( getByText( "침실" ) );
    fireEvent.changeText( getByPlaceholderText( "이름(선택)" ), "안방" );
    fireEvent.press( getByText( "저장" ) );

    await waitFor( () =>
      expect( mockedUpdateRoomDetails ).toHaveBeenCalledWith( "r1", {
        roomType: "BEDROOM",
        label: "안방",
        width: 4,
        height: 3,
        color: expect.any( String ),
      } ),
    );
  } );

  test( "수정 시트의 막을 누르면 저장하지 않고 닫힌다", () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText, getByTestId } =
      renderRoomEdit();
    fireEvent.press( getByText( "침실" ) );
    fireEvent.changeText( getByPlaceholderText( "이름(선택)" ), "안방" );
    fireEvent.press( getByTestId( "sheet-overlay" ) );

    expect( mockedUpdateRoomDetails ).not.toHaveBeenCalled();
    expect( queryByPlaceholderText( "이름(선택)" ) ).toBeNull();
  } );

  test( "방 편집 도면에 삭제 버튼이 없다", () => {
    const { queryByTestId, queryByText } = renderRoomEdit();
    expect( queryByTestId( "delete-button-r1" ) ).toBeNull();
    expect( queryByText( "-" ) ).toBeNull();
  } );

  test( "수정 시트의 '방 삭제' → 집안일 수가 들어간 확인 → '삭제'면 removeRoom이 불리고 닫힌다", async () => {
    mockedRemoveRoom.mockResolvedValue( true );
    useTaskStore.setState( {
      tasks: [
        { id: "t1", roomId: "r1" },
        { id: "t2", roomId: "r1" },
        { id: "t3", roomId: "other" },
      ] as TaskRow[],
    } );
    const { getByText, queryByText } = renderRoomEdit();

    fireEvent.press( getByText( "침실" ) );
    fireEvent.press( getByText( "방 삭제" ) );

    expect( getByText( "침실을 삭제할까요?" ) ).toBeTruthy();
    expect( getByText( "집안일 2개와 완료 기록이 함께 삭제돼요." ) ).toBeTruthy();
    // 수정 시트는 닫혀 있다 (시트를 겹치지 않는다)
    expect( queryByText( "저장" ) ).toBeNull();

    await act( async () => {
      fireEvent.press( getByText( "삭제" ) );
    } );

    expect( mockedRemoveRoom ).toHaveBeenCalledWith( "r1" );
    await waitFor( () => expect( queryByText( "침실을 삭제할까요?" ) ).toBeNull() );
  } );

  test( "집안일이 없는 방이면 '이 방에는 집안일이 없어요.'", () => {
    const { getByText } = renderRoomEdit();
    fireEvent.press( getByText( "침실" ) );
    fireEvent.press( getByText( "방 삭제" ) );
    expect( getByText( "이 방에는 집안일이 없어요." ) ).toBeTruthy();
  } );
} );
