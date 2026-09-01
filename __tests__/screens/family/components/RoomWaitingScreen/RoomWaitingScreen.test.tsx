import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RoomWaitingScreen from "../../../../../src/components/RoomWaitingScreen/RoomWaitingScreen";
import { signOutUser } from "../../../../../src/api/auth";
import { useFamilyStore } from "../../../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../../../src/store/useRoomStore";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";
import type { FamilyRow } from "../../../../../src/store/useFamilyStore";

jest.mock( "../../../../../src/api/auth" );

const mockedSignOutUser = signOutUser as jest.Mock;
const mockedFetchRooms = jest.fn();

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

describe( "RoomWaitingScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState( { status: "joined", family } );
    useRoomStore.setState( { fetchRooms: mockedFetchRooms } );
  } );

  test( "대기 안내 문구를 표시한다", () => {
    const { getByText } = render( <RoomWaitingScreen /> );
    expect( getByText( "집 구조를 만드는 중이에요" ) ).toBeTruthy();
  } );

  test( "새로고침 버튼을 탭하면 fetchRooms를 호출한다", async () => {
    mockedFetchRooms.mockResolvedValue( undefined );
    const { getByText } = render( <RoomWaitingScreen /> );
    fireEvent.press( getByText( "새로고침" ) );
    await waitFor( () =>
      expect( mockedFetchRooms ).toHaveBeenCalledWith( "f1" ),
    );
  } );

  test( "로그아웃 링크를 탭하면 signOutUser를 호출한다", () => {
    mockedSignOutUser.mockResolvedValue( undefined );
    const { getByText } = render( <RoomWaitingScreen /> );
    fireEvent.press( getByText( "로그아웃" ) );
    expect( mockedSignOutUser ).toHaveBeenCalledTimes( 1 );
  } );
} );
