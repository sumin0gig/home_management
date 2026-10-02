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

const mockedAddRoom = jest.fn();
const mockedUpdateRoomDetails = jest.fn();
const mockedUpdateRoomPosition = jest.fn();

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

  test( "수정 모달에서 취소를 탭하면 updateRoomDetails가 호출되지 않는다", () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } =
      renderRoomEdit();
    fireEvent.press( getByText( "침실" ) );
    fireEvent.changeText( getByPlaceholderText( "이름(선택)" ), "안방" );
    fireEvent.press( getByText( "취소" ) );

    expect( mockedUpdateRoomDetails ).not.toHaveBeenCalled();
    expect( queryByPlaceholderText( "이름(선택)" ) ).toBeNull();
  } );
} );
