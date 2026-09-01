import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RoomSetupScreen from "../../../../../src/components/RoomSetupScreen/RoomSetupScreen";
import { signOutUser } from "../../../../../src/api/auth";
import { useFamilyStore } from "../../../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../../../src/store/useRoomStore";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";
import type { FamilyRow } from "../../../../../src/store/useFamilyStore";

jest.mock( "../../../../../src/api/auth" );

const mockedAddRoom = jest.fn();
const mockedSignOutUser = signOutUser as jest.Mock;

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

describe( "RoomSetupScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState( { status: "joined", family } );
    useRoomStore.setState( { addRoom: mockedAddRoom } );
  } );

  test( "방을 하나도 추가하지 않으면 집 만들기가 비활성화된다", () => {
    const { getByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "집 만들기" ) );
    expect( mockedAddRoom ).not.toHaveBeenCalled();
  } );

  test( "방 종류를 탭하면 타일이 추가된다", () => {
    const { getByText, getAllByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 침실" ) );
    expect( getAllByText( "침실" ) ).toHaveLength( 1 );
  } );

  test( "제거 버튼을 탭하면 타일이 사라진다", () => {
    const { getByText, queryByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 침실" ) );
    fireEvent.press( getByText( "✕" ) );
    expect( queryByText( "침실" ) ).toBeNull();
  } );

  test( "타일을 추가하고 집 만들기를 누르면 addRoom이 호출된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 침실" ) );
    fireEvent.press( getByText( "집 만들기" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "BEDROOM",
        "BIG",
        undefined,
      ),
    );
  } );

  test( "여러 방을 추가하고 집 만들기를 누르면 모든 방에 대해 addRoom이 호출된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 침실" ) );
    fireEvent.press( getByText( "+ 거실" ) );
    fireEvent.press( getByText( "집 만들기" ) );

    await waitFor( () => expect( mockedAddRoom ).toHaveBeenCalledTimes( 2 ) );
    expect( mockedAddRoom ).toHaveBeenCalledWith(
      "f1",
      "BEDROOM",
      "BIG",
      undefined,
    );
    expect( mockedAddRoom ).toHaveBeenCalledWith(
      "f1",
      "LIVING_ROOM",
      "VERY_BIG",
      undefined,
    );
  } );

  test( "다른 방 만들기를 탭하면 모달이 열려 이름 입력 필드가 보인다", () => {
    const { getByText, getByPlaceholderText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 다른 방 만들기" ) );
    expect( getByPlaceholderText( "방 이름(예: 서재)" ) ).toBeTruthy();
  } );

  test( "이름 없이 추가를 누르면 방이 생성되지 않는다", () => {
    const { getByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 다른 방 만들기" ) );
    fireEvent.press( getByText( "추가" ) );
    fireEvent.press( getByText( "집 만들기" ) );
    expect( mockedAddRoom ).not.toHaveBeenCalled();
  } );

  test( "이름과 크기를 입력하고 추가하면 커스텀 타일이 생성되고 집 만들기 시 GENERAL_ROOM으로 저장된다", async () => {
    mockedAddRoom.mockResolvedValue( undefined );

    const { getByText, getByPlaceholderText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 다른 방 만들기" ) );
    fireEvent.changeText( getByPlaceholderText( "방 이름(예: 서재)" ), "서재" );
    fireEvent.press( getByText( "큼" ) );
    fireEvent.press( getByText( "추가" ) );

    expect( getByText( "서재" ) ).toBeTruthy();

    fireEvent.press( getByText( "집 만들기" ) );

    await waitFor( () =>
      expect( mockedAddRoom ).toHaveBeenCalledWith(
        "f1",
        "GENERAL_ROOM",
        "BIG",
        "서재",
      ),
    );
  } );

  test( "취소를 누르면 방이 추가되지 않는다", () => {
    const { getByText, getByPlaceholderText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "+ 다른 방 만들기" ) );
    fireEvent.changeText( getByPlaceholderText( "방 이름(예: 서재)" ), "서재" );
    fireEvent.press( getByText( "취소" ) );
    fireEvent.press( getByText( "집 만들기" ) );
    expect( mockedAddRoom ).not.toHaveBeenCalled();
  } );

  test( "로그아웃 링크를 탭하면 signOutUser를 호출한다", () => {
    mockedSignOutUser.mockResolvedValue( undefined );
    const { getByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByText( "로그아웃" ) );
    expect( mockedSignOutUser ).toHaveBeenCalledTimes( 1 );
  } );
} );
