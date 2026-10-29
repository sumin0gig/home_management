import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "../../src/navigation/RootNavigator";
import { useAppUpdateStore } from "../../src/store/useAppUpdateStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import {
  useFamilyStore,
  type FamilyMemberRow,
  type FamilyRow,
} from "../../src/store/useFamilyStore";
import { useMascotStore, type MascotRow } from "../../src/store/useMascotStore";
import { useRoomStore, type RoomRow } from "../../src/store/useRoomStore";
import { resetAllStores } from "../../src/test-utils/resetStores";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTaskStore } from "../../src/store/useTaskStore";
import { ONBOARDING_COMPLETED_AT_KEY } from "../../src/widget/widgetPromptState";

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  registerDeviceToken: jest.fn(),
} ) );

const family = { id: "f1", name: "우리집", ownerId: "u1" } as FamilyRow;
const member = { id: "me", userId: "u2", role: "MEMBER", displayName: "나" } as FamilyMemberRow;
const owner = { id: "o", userId: "u1", role: "OWNER", displayName: "민수" } as FamilyMemberRow;

function setSignedInMember( overrides: { mascot?: MascotRow | null; rooms?: RoomRow[] } = {} ) {
  useAppUpdateStore.setState( {
    status: "upToDate",
    checkForUpdate: jest.fn( () => Promise.resolve() ),
    subscribeToAppState: () => () => {},
  } );
  useAuthStore.setState( {
    status: "signedIn",
    checkAuthStatus: jest.fn( () => Promise.resolve() ),
    subscribeToAuthEvents: () => () => {},
  } );
  useFamilyStore.setState( {
    status: "joined",
    family,
    membership: member,
    members: [owner, member],
    fetchMyFamily: jest.fn( () => Promise.resolve() ),
  } );
  const mascot = overrides.mascot ?? null;
  useMascotStore.setState( {
    status: mascot ? "created" : "none",
    mascot,
    fetchMyMascot: jest.fn( () => Promise.resolve() ),
  } );
  useRoomStore.setState( {
    status: "loaded",
    rooms: overrides.rooms ?? [],
    fetchRooms: jest.fn( () => Promise.resolve() ),
  } );
}

function renderRoot() {
  return render(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );
}

describe( "RootNavigator: 참여자가 집을 기다릴 때", () => {
  beforeEach( () => {
    resetAllStores();
  } );

  test( "방이 없으면 대기 화면, 카드의 '마스코트 만들기'를 누르면 마스코트 만들기", async () => {
    setSignedInMember();
    const { getByText, findByText } = renderRoot();

    await findByText( "민수님이\n집 구조를 만들고 있어요" );
    fireEvent.press( getByText( "마스코트 만들기" ) );

    await findByText( "함께 지낼\n친구를 꾸며주세요" );
  } );

  test( "마스코트를 만든 뒤에도 방이 없으면 다시 대기 화면(카드 없음)", async () => {
    setSignedInMember();
    const { getByText, findByText, queryByTestId } = renderRoot();
    await findByText( "민수님이\n집 구조를 만들고 있어요" );
    fireEvent.press( getByText( "마스코트 만들기" ) );
    await findByText( "함께 지낼\n친구를 꾸며주세요" );

    act( () => {
      useMascotStore.setState( { status: "created", mascot: { id: "m" } as MascotRow } );
    } );

    await findByText( "민수님이\n집 구조를 만들고 있어요" );
    expect( queryByTestId( "waiting-mascot-card" ) ).toBeNull();
  } );

  test( "앱을 처음 시작할 때(불러오는 중)는 시작 화면", async () => {
    setSignedInMember();
    useAuthStore.setState( { status: "loading" } );
    const { getByTestId } = renderRoot();
    await waitFor( () => expect( getByTestId( "startup-screen" ) ).toBeTruthy() );
  } );
} );

describe( "RootNavigator: 우리집 준비 완료", () => {
  const room = { id: "r1", familyId: "f1", roomType: "KITCHEN", x: 0, y: 0, width: 2, height: 2 } as RoomRow;

  beforeEach( async () => {
    resetAllStores();
    await AsyncStorage.clear();
    useTaskStore.setState( {
      fetchTasksForFamily: jest.fn( () => Promise.resolve() ),
      refreshTasksForFamily: jest.fn( () => Promise.resolve() ),
    } );
  } );

  test( "이미 쓰던 사용자(시작 때 마스코트·방이 있음)는 보여주지 않고 기록만 한다", async () => {
    setSignedInMember( { mascot: { id: "m", earStyle: "ROUND", tailStyle: "STRAIGHT" } as MascotRow, rooms: [room] } );
    const { queryByText } = renderRoot();

    await waitFor( async () =>
      expect( await AsyncStorage.getItem( ONBOARDING_COMPLETED_AT_KEY ) ).not.toBeNull(),
    );
    expect( queryByText( "우리집 준비 완료!" ) ).toBeNull();
  } );

  test( "마스코트를 처음 만든 직후 한 번 보여주고, '시작하기'를 누르면 기록하고 넘어간다", async () => {
    setSignedInMember( { rooms: [room] } );
    const { findByText, getByText, queryByText } = renderRoot();
    await findByText( "함께 지낼\n친구를 꾸며주세요" );

    act( () => {
      useMascotStore.setState( {
        status: "created",
        mascot: { id: "m", earStyle: "ROUND", tailStyle: "STRAIGHT" } as MascotRow,
      } );
    } );

    await findByText( "우리집 준비 완료!" );
    // 참여자에게는 초대 안내·버튼이 없다
    expect( queryByText( "가족 초대하기" ) ).toBeNull();
    expect( queryByText( "가족을 초대해서 나눠 해요" ) ).toBeNull();

    await act( async () => {
      fireEvent.press( getByText( "시작하기" ) );
    } );
    await waitFor( () => expect( queryByText( "우리집 준비 완료!" ) ).toBeNull() );
    expect( await AsyncStorage.getItem( ONBOARDING_COMPLETED_AT_KEY ) ).not.toBeNull();
  } );

  test( "관리자는 초대 안내 줄과 '가족 초대하기' 버튼이 있다", async () => {
    setSignedInMember( { rooms: [room] } );
    useFamilyStore.setState( { membership: owner } );
    const { findByText, getByText } = renderRoot();
    await findByText( "함께 지낼\n친구를 꾸며주세요" );

    act( () => {
      useMascotStore.setState( {
        status: "created",
        mascot: { id: "m", earStyle: "ROUND", tailStyle: "STRAIGHT" } as MascotRow,
      } );
    } );

    await findByText( "우리집 준비 완료!" );
    expect( getByText( "가족을 초대해서 나눠 해요" ) ).toBeTruthy();
    expect( getByText( "가족 초대하기" ) ).toBeTruthy();
  } );
} );

