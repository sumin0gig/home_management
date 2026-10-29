import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import RoomSetupScreen from "../../../../../src/components/RoomSetupScreen/RoomSetupScreen";
import { listTaskTemplatesForRoomType } from "../../../../../actions";
import { useFamilyStore } from "../../../../../src/store/useFamilyStore";
import { useRoomStore } from "../../../../../src/store/useRoomStore";
import { HOUSE_PRESETS } from "../../../../../src/store/housePresets";
import { clearTemplateCache } from "../../../../../src/components/Onboarding/TemplateChoreList";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";
import type { FamilyRow } from "../../../../../src/store/useFamilyStore";

jest.mock( "../../../../../actions", () => ( {
  ...jest.requireActual( "../../../../../actions" ),
  listTaskTemplatesForRoomType: jest.fn(),
} ) );

const mockedAddRoom = jest.fn();
const mockedListTemplates = listTaskTemplatesForRoomType as jest.Mock;

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

function template( id: string, roomType: string, title: string ) {
  return { id, roomType, title, recurrenceType: "INTERVAL", intervalValue: 1, intervalUnit: "WEEK" };
}

// 방 종류마다 템플릿 2개
mockedListTemplates.mockImplementation( ( roomType: string ) =>
  Promise.resolve( [
    template( `${roomType}-a`, roomType, `${roomType} 청소 A` ),
    template( `${roomType}-b`, roomType, `${roomType} 청소 B` ),
  ] ),
);

function layoutCanvas( getByTestId: ReturnType<typeof render>["getByTestId"] ) {
  fireEvent( getByTestId( "floor-plan-canvas" ), "layout", {
    nativeEvent: { layout: { width: 300, height: 300 } },
  } );
}

describe( "RoomSetupScreen", () => {
  beforeEach( () => {
    mockedAddRoom.mockReset();
    mockedListTemplates.mockClear();
    clearTemplateCache();
    resetAllStores();
    useFamilyStore.setState( { status: "joined", family } );
    useRoomStore.setState( { addRoom: mockedAddRoom } );
  } );

  test( "집 모양: 기본은 투룸이고, 버튼 이름이 고른 모양을 따른다", () => {
    const { getByText, getByTestId } = render( <RoomSetupScreen /> );
    expect( getByText( "어떤 집에 살고 있나요?" ) ).toBeTruthy();
    expect( getByTestId( "house-shape-two" ).props.accessibilityState ).toEqual( { selected: true } );
    expect( getByText( "투룸으로 시작하기" ) ).toBeTruthy();

    fireEvent.press( getByTestId( "house-shape-blank" ) );
    expect( getByText( "빈 도면으로 시작하기" ) ).toBeTruthy();
  } );

  test( "프리셋을 고르면 도면에 그 방들이 놓인다", () => {
    const { getByText, getByTestId, getAllByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-one" ) );
    fireEvent.press( getByText( "원룸으로 시작하기" ) );
    layoutCanvas( getByTestId );

    expect( getByText( "우리집에 맞게 고쳐주세요" ) ).toBeTruthy();
    HOUSE_PRESETS.one.rooms.forEach( room => {
      const label = { BEDROOM: "침실", KITCHEN: "부엌", BATHROOM: "화장실", ENTRANCE: "현관" }[
        room.roomType as "BEDROOM"
      ];
      expect( getAllByText( label ).length ).toBeGreaterThan( 0 );
    } );
  } );

  test( "빈 도면이면 방이 0개이고 '다음'이 동작하지 않는다", () => {
    const { getByText, getByTestId, queryByTestId } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-blank" ) );
    fireEvent.press( getByText( "빈 도면으로 시작하기" ) );

    expect( queryByTestId( "floor-plan-canvas" ) ).toBeNull();
    fireEvent.press( getByText( "다음" ) );
    expect( getByText( "우리집에 맞게 고쳐주세요" ) ).toBeTruthy();
  } );

  test( "방 추가 칩이 도면보다 위에 있고, 누르면 방이 생긴다", () => {
    const { getByText, getByTestId, toJSON } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-blank" ) );
    fireEvent.press( getByText( "빈 도면으로 시작하기" ) );
    fireEvent.press( getByText( "+ 침실" ) );
    layoutCanvas( getByTestId );

    const tree = JSON.stringify( toJSON() );
    expect( tree.indexOf( "add-room-chips" ) ).toBeLessThan( tree.indexOf( "floor-plan-canvas" ) );
    expect( getByText( "침실" ) ).toBeTruthy();
  } );

  test( "기본 집안일: 모두 선택된 채 시작하고, 2개를 끄면 N이 2 줄고 그 템플릿을 뺀 templateIds로 만든다", async () => {
    mockedAddRoom.mockResolvedValue( true );
    const { getByText, getByTestId, findByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-one" ) );
    fireEvent.press( getByText( "원룸으로 시작하기" ) );
    fireEvent.press( getByText( "다음" ) );

    // 원룸 4개 방 × 템플릿 2개
    await findByText( "우리집 만들기 · 집안일 8개" );

    fireEvent.press( getByTestId( "chore-one-0-BEDROOM-a" ) );
    fireEvent.press( getByTestId( "chore-one-1-KITCHEN-b" ) );
    expect( getByText( "우리집 만들기 · 집안일 6개" ) ).toBeTruthy();

    await act( async () => {
      fireEvent.press( getByText( "우리집 만들기 · 집안일 6개" ) );
    } );

    expect( mockedAddRoom ).toHaveBeenCalledTimes( 4 );
    expect( mockedAddRoom ).toHaveBeenCalledWith(
      "f1",
      "BEDROOM",
      undefined,
      expect.objectContaining( { x: 0, y: 0, width: 4, height: 3 } ),
      { templateIds: ["BEDROOM-b"] },
    );
    expect( mockedAddRoom ).toHaveBeenCalledWith(
      "f1",
      "KITCHEN",
      undefined,
      expect.any( Object ),
      { templateIds: ["KITCHEN-a"] },
    );
    // 같은 방 종류의 템플릿은 한 번만 불러온다
    expect( mockedListTemplates ).toHaveBeenCalledTimes( 4 );
  } );

  test( "같은 종류 방이 여러 개면(작은방 2개) 각각 따로 고른다", async () => {
    const { getByText, getByTestId, findByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-three" ) );
    fireEvent.press( getByText( "쓰리룸으로 시작하기" ) );
    fireEvent.press( getByText( "다음" ) );
    await findByText( /우리집 만들기 · 집안일 16개/ );

    fireEvent.press( getByTestId( "chore-three-3-GENERAL_ROOM-a" ) );
    expect( getByTestId( "chore-three-3-GENERAL_ROOM-a" ).props.accessibilityState ).toEqual( { checked: false } );
    expect( getByTestId( "chore-three-4-GENERAL_ROOM-a" ).props.accessibilityState ).toEqual( { checked: true } );
    expect( mockedListTemplates.mock.calls.filter( ( [t] ) => t === "GENERAL_ROOM" ) ).toHaveLength( 1 );
  } );

  test( "일부 방만 실패하면 오류를 보여주고, 다시 누르면 아직 만들지 않은 방만 만든다", async () => {
    mockedAddRoom.mockImplementation( ( _f: string, roomType: string ) => {
      if (roomType === "KITCHEN") {
        useRoomStore.setState( { error: "방 생성에 실패했습니다." } );
        return Promise.resolve( false );
      }
      return Promise.resolve( true );
    } );
    const { getByText, getByTestId, findByText } = render( <RoomSetupScreen /> );
    fireEvent.press( getByTestId( "house-shape-one" ) );
    fireEvent.press( getByText( "원룸으로 시작하기" ) );
    fireEvent.press( getByText( "다음" ) );
    const button = await findByText( "우리집 만들기 · 집안일 8개" );

    await act( async () => {
      fireEvent.press( button );
    } );
    await waitFor( () => expect( getByText( "방 생성에 실패했습니다." ) ).toBeTruthy() );
    expect( useRoomStore.getState().houseSetupPending ).toBe( true );

    mockedAddRoom.mockClear();
    mockedAddRoom.mockResolvedValue( true );
    await act( async () => {
      fireEvent.press( getByText( /우리집 만들기/ ) );
    } );

    expect( mockedAddRoom ).toHaveBeenCalledTimes( 1 );
    expect( mockedAddRoom.mock.calls[0][1] ).toBe( "KITCHEN" );
    expect( useRoomStore.getState().houseSetupPending ).toBe( false );
  } );
} );
