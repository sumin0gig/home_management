import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RoomEditScreen from "../../../src/screens/home/RoomEditScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import type { FamilyRow } from "../../../src/store/useFamilyStore";
import type { RoomRow } from "../../../src/store/useRoomStore";

const mockedAddRoom = jest.fn();
const mockedUpdateRoomDetails = jest.fn();

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
    } );
  } );

  test( "+ 방 추가로 방을 만들면 addRoom이 호출된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText } = render( <RoomEditScreen /> );
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

  test( "방을 탭하면 수정 모달이 열리고 저장하면 updateRoomDetails가 호출된다", async () => {
    mockedUpdateRoomDetails.mockResolvedValue( undefined );

    const { getByText, getByPlaceholderText } = render( <RoomEditScreen /> );
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
      render( <RoomEditScreen /> );
    fireEvent.press( getByText( "침실" ) );
    fireEvent.changeText( getByPlaceholderText( "이름(선택)" ), "안방" );
    fireEvent.press( getByText( "취소" ) );

    expect( mockedUpdateRoomDetails ).not.toHaveBeenCalled();
    expect( queryByPlaceholderText( "이름(선택)" ) ).toBeNull();
  } );
} );
