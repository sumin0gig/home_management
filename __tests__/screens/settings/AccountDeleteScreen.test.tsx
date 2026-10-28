import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AccountDeleteScreen from "../../../src/screens/settings/AccountDeleteScreen";
import { deleteAccount } from "../../../actions";
import {
  useFamilyStore,
  type FamilyMemberRow,
  type FamilyRow,
} from "../../../src/store/useFamilyStore";
import { useRoomStore, type RoomRow } from "../../../src/store/useRoomStore";
import { useTaskStore, type TaskRow } from "../../../src/store/useTaskStore";
import { useMascotStore, type MascotRow } from "../../../src/store/useMascotStore";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
  deleteAccount: jest.fn(),
  getAuthErrorMessage: jest.fn( ( err: Error ) => err.message ),
} ) );

let mockTransferEnabled = false;
jest.mock( "../../../src/constants/app", () => {
  const actual = jest.requireActual( "../../../src/constants/app" );
  const mocked = { ...actual };
  Object.defineProperty( mocked, "OWNER_TRANSFER_ENABLED", {
    get: () => mockTransferEnabled,
  } );
  return mocked;
} );

const mockedDeleteAccount = deleteAccount as jest.Mock;
const family = { id: "f1", name: "우리집" } as FamilyRow;
const owner = { id: "m1", userId: "u1", displayName: "수민", role: "OWNER" } as FamilyMemberRow;
const minsu = { id: "m2", userId: "u2", displayName: "민수", role: "MEMBER" } as FamilyMemberRow;
const jisu = { id: "m3", userId: "u3", displayName: "지수", role: "MEMBER" } as FamilyMemberRow;

function setup( membership: FamilyMemberRow, members: FamilyMemberRow[] ) {
  useFamilyStore.setState( {
    family,
    membership,
    members,
    refreshMembers: jest.fn( () => Promise.resolve() ),
  } );
}

async function renderScreen() {
  const navigation = createMockNavigation<"AccountDelete">();
  const utils = render( <AccountDeleteScreen navigation={ navigation } route={ {} as never } /> );
  await waitFor( () => expect( utils.queryByTestId( "account-delete-checking" ) ).toBeNull() );
  return { ...utils, navigation };
}

describe( "AccountDeleteScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    mockTransferEnabled = false;
    resetAllStores();
    useAuthStore.setState( { accountDeleted: false } );
    useRoomStore.setState( { rooms: [{ id: "r1" }, { id: "r2" }, { id: "r3" }] as RoomRow[] } );
    useTaskStore.setState( { tasks: [{ id: "t1" }, { id: "t2" }] as TaskRow[] } );
    useMascotStore.setState( { status: "created", mascot: { id: "ms", happiness: 150 } as MascotRow } );
  } );

  test( "구성원: 계정과 마스코트만 지워진다고 보여주고 '남는 것'은 없다", async () => {
    setup( minsu, [owner, minsu] );
    const { getByText, getByTestId, queryByText } = await renderScreen();

    expect( getByText( "탈퇴하기 전에 확인해주세요" ) ).toBeTruthy();
    expect( getByTestId( "account-delete-list" ) ).toHaveTextContent( /내 계정과 이름/ );
    expect( getByText( "내 마스코트와 추억 Lv.2" ) ).toBeTruthy();
    expect( queryByText( /가족$/ ) ).toBeNull();
    expect( queryByText( /남는 것/ ) ).toBeNull();
  } );

  test( "나 혼자: 가족·방·집안일 개수(스토어 값)·완료 기록까지 보여준다", async () => {
    setup( owner, [owner] );
    const { getByText } = await renderScreen();

    expect( getByText( "우리집 가족" ) ).toBeTruthy();
    expect( getByText( "방 3개" ) ).toBeTruthy();
    expect( getByText( "집안일 2개" ) ).toBeTruthy();
    expect( getByText( "지금까지의 완료 기록 전부" ) ).toBeTruthy();
  } );

  test( "체크 전에는 '탈퇴하기'를 눌러도 deleteAccount가 불리지 않는다", async () => {
    setup( minsu, [owner, minsu] );
    const { getByTestId } = await renderScreen();

    fireEvent.press( getByTestId( "account-delete-button" ) );
    expect( mockedDeleteAccount ).not.toHaveBeenCalled();
  } );

  test( "체크하고 탈퇴하면 진행 막을 보여주고, 계정을 지우기 직전 완료 표시를 켠다", async () => {
    let finish: () => void = () => {};
    mockedDeleteAccount.mockImplementation( ( options?: { onBeforeDeleteUser?: () => void } ) =>
      new Promise<void>( resolve => {
        finish = () => {
          options?.onBeforeDeleteUser?.();
          resolve();
        };
      } ),
    );
    setup( minsu, [owner, minsu] );
    const { getByText, getByTestId } = await renderScreen();

    fireEvent.press( getByText( "되돌릴 수 없다는 걸 확인했어요" ) );
    fireEvent.press( getByTestId( "account-delete-button" ) );

    expect( mockedDeleteAccount ).toHaveBeenCalledTimes( 1 );
    expect( getByText( "탈퇴하는 중이에요. 앱을 닫지 마세요." ) ).toBeTruthy();
    await act( async () => finish() );
    expect( useAuthStore.getState().accountDeleted ).toBe( true );
  } );

  test( "실패하면 막을 걷고 오류와 '다시 시도'", async () => {
    mockedDeleteAccount.mockRejectedValue( new Error( "회원 정보 삭제에 실패했습니다." ) );
    setup( minsu, [owner, minsu] );
    const { getByText, getByTestId, queryByTestId } = await renderScreen();

    fireEvent.press( getByText( "되돌릴 수 없다는 걸 확인했어요" ) );
    await act( async () => {
      fireEvent.press( getByTestId( "account-delete-button" ) );
    } );

    expect( queryByTestId( "account-delete-progress" ) ).toBeNull();
    expect( getByText( "회원 정보 삭제에 실패했습니다." ) ).toBeTruthy();
    expect( getByText( "다시 시도" ) ).toBeTruthy();
    expect( useAuthStore.getState().accountDeleted ).toBe( false );
  } );

  describe( "구성원이 있는 관리자", () => {
    test( "넘기기 불가: 탈퇴 버튼 없이 안내와 '가족 관리로 가기'만", async () => {
      setup( owner, [owner, minsu, jisu] );
      const { getByText, queryByText, queryByTestId, navigation } = await renderScreen();

      expect( getByText( "지금은 탈퇴할 수 없어요" ) ).toBeTruthy();
      expect( getByText( "우리집에 민수님 외 1명이 함께 있어요" ) ).toBeTruthy();
      expect( getByText( /구성원을 내보낸 뒤 탈퇴할 수 있어요\./ ) ).toBeTruthy();
      expect( queryByText( "관리자 넘기기" ) ).toBeNull();
      expect( queryByTestId( "account-delete-button" ) ).toBeNull();

      fireEvent.press( getByText( "가족 관리로 가기" ) );
      expect( navigation.navigate ).toHaveBeenCalledWith( "FamilyMain" );
    } );

    test( "넘기기 가능: '관리자 넘기기'는 가족 화면의 넘기기 시트로", async () => {
      mockTransferEnabled = true;
      setup( owner, [owner, minsu] );
      const { getByText, navigation } = await renderScreen();

      expect( getByText( "우리집에 민수님이 함께 있어요" ) ).toBeTruthy();
      expect( getByText( /방과 집안일은 가족에게 남아요\./ ) ).toBeTruthy();
      fireEvent.press( getByText( "관리자 넘기기" ) );
      expect( navigation.navigate ).toHaveBeenCalledWith( "FamilyMain", { transfer: true } );
    } );
  } );
} );
