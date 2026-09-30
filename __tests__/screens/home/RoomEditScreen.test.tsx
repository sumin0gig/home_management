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

const bathroom: RoomRow = {
  id: "r2",
  familyId: "f1",
  roomType: "BATHROOM",
  label: null,
  x: 4,
  y: 0,
  width: 2,
  height: 1,
} as RoomRow;

// 드래그 제스처 자체는 DraggableRoomBlock 몫이므로, 여기서는 드래그가 끝났을 때
// 캔버스가 부모에게 알려주는 onRoomMove를 직접 호출해 미저장 위치를 만든다.
function moveRoom(
  utils: ReturnType<typeof renderRoomEdit>,
  roomId: string,
  x: number,
  y: number,
) {
  const canvas = utils.UNSAFE_getByType( FloorPlanCanvas );
  act( () => canvas.props.onRoomMove( roomId, x, y ) );
}

// 방 삭제는 DraggableRoomBlock이 store의 removeRoom으로 즉시 DB에 반영하고
// store의 rooms에서 빼는 것으로 끝나므로, 그 결과(rooms 갱신)만 흉내 낸다.
function removeRoomFromStore(roomId: string) {
  act( () =>
    useRoomStore.setState( {
      rooms: useRoomStore.getState().rooms.filter( room => room.id !== roomId ),
    } ),
  );
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

  test( "+ 방 추가로 방을 만들면 addRoom이 빈 자리 좌표와 함께 호출된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText } = renderRoomEdit();
    fireEvent.press( getByText( "+ 방 추가" ) );
    fireEvent.press( getByText( "거실" ) );
    fireEvent.press( getByText( "추가" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "LIVING_ROOM",
        undefined,
        { x: 4, y: 0 },
      ),
    );
  } );

  test( "삭제한 방을 비운 자리로 다른 방을 옮겨두면, 새 방은 그 자리를 피해서 배치된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );
    useRoomStore.setState( { rooms: [bedroom, bathroom] } );

    const utils = renderRoomEdit();
    const { getByText } = utils;
    removeRoomFromStore( "r1" );
    // DB상 화장실은 아직 (4,0)이지만 화면에서는 (0,0)으로 옮겨둔 상태
    moveRoom( utils, "r2", 0, 0 );

    fireEvent.press( getByText( "+ 방 추가" ) );
    fireEvent.press( getByText( "거실" ) );
    fireEvent.press( getByText( "추가" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "LIVING_ROOM",
        undefined,
        { x: 2, y: 0 },
      ),
    );
  } );

  test( "옮겨두고 삭제한 방의 위치는 위치 저장 대상에서 빠진다", async () => {
    mockedUpdateRoomPosition.mockResolvedValue( undefined );
    useRoomStore.setState( { rooms: [bedroom, bathroom] } );

    const utils = renderRoomEdit();
    const { getByText } = utils;
    moveRoom( utils, "r1", 0, 3 );
    moveRoom( utils, "r2", 6, 0 );
    removeRoomFromStore( "r1" );

    fireEvent.press( getByText( "위치 저장" ) );

    await waitFor( () =>
      expect( mockedUpdateRoomPosition ).toHaveBeenCalledWith( "r2", 6, 0 ),
    );
    expect( mockedUpdateRoomPosition ).toHaveBeenCalledTimes( 1 );
  } );

  test( "옮겨둔 방이 삭제된 방뿐이면 위치 저장이 아무것도 update하지 않는다", () => {
    useRoomStore.setState( { rooms: [bedroom, bathroom] } );

    const utils = renderRoomEdit();
    const { getByText } = utils;
    moveRoom( utils, "r2", 6, 0 );
    removeRoomFromStore( "r2" );

    fireEvent.press( getByText( "위치 저장" ) );

    expect( mockedUpdateRoomPosition ).not.toHaveBeenCalled();
  } );

  test( "방을 탭하면 수정 모달이 열리고 저장하면 updateRoomDetails가 호출된다", async () => {
    mockedUpdateRoomDetails.mockResolvedValue( undefined );

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
