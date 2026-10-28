import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import FamilyScreen from "../../../src/screens/family/FamilyScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { useRoomStore, type RoomRow } from "../../../src/store/useRoomStore";
import { useTaskStore, type TaskRow } from "../../../src/store/useTaskStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { FamilyRow, FamilyMemberRow } from "../../../src/store/useFamilyStore";

let mockTransferEnabled = false;
// 테스트마다 넘기기 가능 여부를 바꾼다 (객체 펼치기는 getter를 값으로 굳히므로 defineProperty로).
jest.mock( "../../../src/constants/app", () => {
  const actual = jest.requireActual( "../../../src/constants/app" );
  const mocked = { ...actual };
  Object.defineProperty( mocked, "OWNER_TRANSFER_ENABLED", {
    get: () => mockTransferEnabled,
  } );
  return mocked;
} );

function renderFamilyScreen( navigation = createMockNavigation<"FamilyMain">() ) {
  return {
    ...render( <FamilyScreen navigation={ navigation } route={ {} as never } /> ),
    navigation,
  };
}

const mockedRemoveMember = jest.fn();
const mockedLeaveFamily = jest.fn();
const mockedTransfer = jest.fn();
const mockedRename = jest.fn();

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

const owner: FamilyMemberRow = {
  id: "m1",
  familyId: "f1",
  userId: "u1",
  displayName: "me",
  role: "OWNER",
} as FamilyMemberRow;

const partner: FamilyMemberRow = {
  id: "m2",
  familyId: "f1",
  userId: "u2",
  displayName: "partner",
  role: "MEMBER",
} as FamilyMemberRow;

function setFamily( membership: FamilyMemberRow, members: FamilyMemberRow[] ) {
  useFamilyStore.setState( { status: "joined", family, membership, members } );
}

describe( "FamilyScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    mockTransferEnabled = false;
    resetAllStores();
    useFamilyStore.setState( {
      removeMember: mockedRemoveMember,
      leaveFamily: mockedLeaveFamily,
      transferOwnership: mockedTransfer,
      renameFamily: mockedRename,
    } );
    useRoomStore.setState( { rooms: [{ id: "r1" }, { id: "r2" }] as RoomRow[] } );
    useTaskStore.setState( { tasks: [{ id: "t1" }, { id: "t2" }, { id: "t3" }] as TaskRow[] } );
  } );

  test( "가족 카드에 이름과 구성원·방·집안일 수, 내 줄에 '나'", () => {
    setFamily( owner, [owner, partner] );
    const { getByText, getByTestId } = renderFamilyScreen();

    expect( getByText( "TestFamily" ) ).toBeTruthy();
    expect( getByText( "구성원 2명 · 방 2개 · 집안일 3개" ) ).toBeTruthy();
    expect( getByTestId( "member-m1" ) ).toHaveTextContent( /나/ );
    expect( getByTestId( "member-m2" ) ).not.toHaveTextContent( /나$/ );
  } );

  test( "관리자가 아니면 ⋯ 버튼과 이름 바꾸기가 없다", () => {
    setFamily( partner, [owner, partner] );
    const { queryByLabelText, queryByText } = renderFamilyScreen();
    expect( queryByLabelText( "me 메뉴" ) ).toBeNull();
    expect( queryByText( "이름 바꾸기" ) ).toBeNull();
  } );

  test( "가족 초대하기를 누르면 AddFamilyMember", () => {
    setFamily( owner, [owner, partner] );
    const { getByText, navigation } = renderFamilyScreen();
    fireEvent.press( getByText( "가족 초대하기" ) );
    expect( navigation.navigate ).toHaveBeenCalledWith( "AddFamilyMember" );
  } );

  test( "내보내기는 ⋯ → '가족에서 내보내기' → 확인 시트를 거쳐야 removeMember", async () => {
    mockedRemoveMember.mockResolvedValue( true );
    setFamily( owner, [owner, partner] );
    const { getByLabelText, getByText, queryByText } = renderFamilyScreen();

    fireEvent.press( getByLabelText( "partner 메뉴" ) );
    // 넘기기가 꺼져 있으면 넘기기 줄이 없다
    expect( queryByText( "관리자 넘기기" ) ).toBeNull();
    fireEvent.press( getByText( "가족에서 내보내기" ) );
    expect( mockedRemoveMember ).not.toHaveBeenCalled();
    expect( getByText( "partner님을 내보낼까요?" ) ).toBeTruthy();
    expect( getByText( "partner님이 완료한 기록은 남아요." ) ).toBeTruthy();

    await act( async () => {
      fireEvent.press( getByText( "내보내기" ) );
    } );
    expect( mockedRemoveMember ).toHaveBeenCalledWith( "m2" );
  } );

  test( "넘기기가 켜져 있으면 ⋯ 메뉴에 '관리자 넘기기' → 확인 → transferOwnership", async () => {
    mockTransferEnabled = true;
    mockedTransfer.mockResolvedValue( true );
    setFamily( owner, [owner, partner] );
    const { getByLabelText, getByText } = renderFamilyScreen();

    fireEvent.press( getByLabelText( "partner 메뉴" ) );
    fireEvent.press( getByText( "관리자 넘기기" ) );
    expect( getByText( "partner님에게 관리자를 넘길까요?" ) ).toBeTruthy();
    await act( async () => {
      fireEvent.press( getByText( "넘기기" ) );
    } );
    expect( mockedTransfer ).toHaveBeenCalledWith( "m2" );
  } );

  describe( "가족 떠나기", () => {
    test( "구성원: '우리집에서 나갈까요?' → 나가기", async () => {
      mockedLeaveFamily.mockResolvedValue( true );
      setFamily( partner, [owner, partner] );
      const { getByText } = renderFamilyScreen();

      fireEvent.press( getByText( "가족 떠나기" ) );
      expect( getByText( "우리집에서 나갈까요?" ) ).toBeTruthy();
      await act( async () => {
        fireEvent.press( getByText( "나가기" ) );
      } );
      expect( mockedLeaveFamily ).toHaveBeenCalled();
    } );

    test( "혼자인 관리자: 버튼 이름이 다르고, 지워지는 방·집안일 개수를 보여준다", async () => {
      mockedLeaveFamily.mockResolvedValue( true );
      setFamily( owner, [owner] );
      const { getByText, getAllByText } = renderFamilyScreen();

      fireEvent.press( getByText( "우리집 삭제하고 떠나기" ) );
      expect( getByText( "떠나면 우리집이 삭제돼요" ) ).toBeTruthy();
      expect( getByText( "· 방 2개와 집안일 3개" ) ).toBeTruthy();
      expect( getByText( "내 계정과 마스코트는 남아요." ) ).toBeTruthy();

      // 화면 아래 버튼과 시트 확인 버튼이 같은 이름 — 시트 쪽(마지막)을 누른다
      const buttons = getAllByText( "우리집 삭제하고 떠나기" );
      await act( async () => {
        fireEvent.press( buttons[buttons.length - 1] );
      } );
      expect( mockedLeaveFamily ).toHaveBeenCalled();
    } );

    test( "구성원이 있는 관리자, 넘기기 불가: '지금은 떠날 수 없어요', 확인을 눌러도 leaveFamily 안 함", () => {
      setFamily( owner, [owner, partner] );
      const { getByText, queryByText } = renderFamilyScreen();

      fireEvent.press( getByText( "가족 떠나기" ) );
      expect( getByText( "지금은 떠날 수 없어요" ) ).toBeTruthy();
      expect( queryByText( "취소" ) ).toBeNull();
      fireEvent.press( getByText( "확인" ) );

      expect( mockedLeaveFamily ).not.toHaveBeenCalled();
      expect( queryByText( "지금은 떠날 수 없어요" ) ).toBeNull();
    } );

    test( "구성원이 있는 관리자, 넘기기 가능: 고르기 전에는 비활성, 고르면 넘기고 떠난다", async () => {
      mockTransferEnabled = true;
      mockedTransfer.mockResolvedValue( true );
      mockedLeaveFamily.mockResolvedValue( true );
      setFamily( owner, [owner, partner] );
      const { getByText, getByTestId, getAllByRole } = renderFamilyScreen();

      fireEvent.press( getByText( "가족 떠나기" ) );
      expect( getByText( "관리자를 넘겨야 떠날 수 있어요" ) ).toBeTruthy();
      fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
      expect( mockedTransfer ).not.toHaveBeenCalled();

      fireEvent.press( getAllByRole( "radio" )[0] );
      expect( getByText( "partner님에게 넘기고 떠나기" ) ).toBeTruthy();
      await act( async () => {
        fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
      } );

      expect( mockedTransfer ).toHaveBeenCalledWith( "m2" );
      expect( mockedLeaveFamily ).toHaveBeenCalled();
    } );

    test( "실패하면 시트 안에 오류를 보여주고 닫히지 않는다", async () => {
      mockedLeaveFamily.mockImplementation( () => {
        useFamilyStore.setState( { error: "가족을 떠나지 못했습니다." } );
        return Promise.resolve( false );
      } );
      setFamily( partner, [owner, partner] );
      const { getByText } = renderFamilyScreen();

      fireEvent.press( getByText( "가족 떠나기" ) );
      await act( async () => {
        fireEvent.press( getByText( "나가기" ) );
      } );

      expect( getByText( "가족을 떠나지 못했습니다." ) ).toBeTruthy();
      expect( getByText( "우리집에서 나갈까요?" ) ).toBeTruthy();
    } );
  } );

  test( "관리자는 '이름 바꾸기'로 가족 이름을 바꾼다 (엔터로 저장)", async () => {
    mockedRename.mockResolvedValue( true );
    setFamily( owner, [owner] );
    const { getByText, getByLabelText } = renderFamilyScreen();

    fireEvent.press( getByText( "이름 바꾸기" ) );
    expect( getByLabelText( "가족 이름" ).props.value ).toBe( "TestFamily" );
    fireEvent.changeText( getByLabelText( "가족 이름" ), "새 이름" );
    await act( async () => {
      fireEvent( getByLabelText( "가족 이름" ), "submitEditing" );
    } );
    expect( mockedRename ).toHaveBeenCalledWith( "새 이름" );
  } );

  test( "탈퇴 화면에서 '관리자 넘기기'로 오면 넘길 사람 고르기 시트가 바로 열리고, 넘기기만 한다", async () => {
    mockTransferEnabled = true;
    mockedTransfer.mockResolvedValue( true );
    setFamily( owner, [owner, partner] );
    const navigation = createMockNavigation<"FamilyMain">();
    const { getByText, getAllByRole, getByTestId } = render(
      <FamilyScreen navigation={ navigation } route={ { params: { transfer: true } } as never } />,
    );

    expect( getByText( "누구에게 관리자를 넘길까요?" ) ).toBeTruthy();
    fireEvent.press( getAllByRole( "radio" )[0] );
    await act( async () => {
      fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
    } );

    expect( mockedTransfer ).toHaveBeenCalledWith( "m2" );
    expect( mockedLeaveFamily ).not.toHaveBeenCalled();
  } );
} );
