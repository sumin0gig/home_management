import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import RoomWaitingScreen, {
  WAITING_POLL_INTERVAL_MS,
} from "../../../../../src/components/RoomWaitingScreen/RoomWaitingScreen";
import { useFamilyStore } from "../../../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../../../src/store/useRoomStore";
import { useMascotStore, type MascotRow } from "../../../../../src/store/useMascotStore";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";
import type { FamilyMemberRow, FamilyRow } from "../../../../../src/store/useFamilyStore";

const mockedFetchRooms = jest.fn();

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

const owner = { id: "m1", userId: "u1", displayName: "민수", role: "OWNER" } as FamilyMemberRow;

describe( "RoomWaitingScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useMascotStore.getState().reset();
    useFamilyStore.setState( { status: "joined", family, members: [owner] } );
    useRoomStore.setState( { fetchRooms: mockedFetchRooms } );
  } );

  afterEach( () => {
    jest.useRealTimers();
  } );

  test( "관리자 이름으로 안내하고, 새로고침 버튼은 없다", () => {
    const { getByText, queryByText } = render( <RoomWaitingScreen /> );
    expect( getByText( "민수님이\n집 구조를 만들고 있어요" ) ).toBeTruthy();
    expect( getByText( "다 되면 자동으로 넘어가요" ) ).toBeTruthy();
    expect( queryByText( "새로고침" ) ).toBeNull();
    expect( queryByText( "로그아웃" ) ).toBeNull();
  } );

  test( "15초마다 방을 다시 불러오고, 화면이 사라지면 멈춘다", () => {
    jest.useFakeTimers();
    const { unmount } = render( <RoomWaitingScreen /> );

    act( () => {
      jest.advanceTimersByTime( WAITING_POLL_INTERVAL_MS );
    } );
    expect( mockedFetchRooms ).toHaveBeenCalledTimes( 1 );
    expect( mockedFetchRooms ).toHaveBeenCalledWith( "f1" );

    act( () => {
      jest.advanceTimersByTime( WAITING_POLL_INTERVAL_MS );
    } );
    expect( mockedFetchRooms ).toHaveBeenCalledTimes( 2 );

    unmount();
    act( () => {
      jest.advanceTimersByTime( WAITING_POLL_INTERVAL_MS * 3 );
    } );
    expect( mockedFetchRooms ).toHaveBeenCalledTimes( 2 );
  } );

  test( "마스코트가 없으면 카드가 있고, 누르면 onMakeMascot", () => {
    const onMakeMascot = jest.fn();
    const { getByText } = render( <RoomWaitingScreen onMakeMascot={ onMakeMascot } /> );
    fireEvent.press( getByText( "마스코트 만들기" ) );
    expect( onMakeMascot ).toHaveBeenCalled();
  } );

  test( "마스코트가 이미 있으면 카드가 없다", () => {
    useMascotStore.setState( { status: "created", mascot: { id: "m" } as MascotRow } );
    const { queryByTestId } = render( <RoomWaitingScreen onMakeMascot={ jest.fn() } /> );
    expect( queryByTestId( "waiting-mascot-card" ) ).toBeNull();
  } );
} );
