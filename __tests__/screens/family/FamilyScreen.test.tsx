import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FamilyScreen from "../../../src/screens/family/FamilyScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import type { FamilyRow, FamilyMemberRow } from "../../../src/store/useFamilyStore";

const mockedRemoveMember = jest.fn();
const mockedLeaveFamily = jest.fn();

const family: FamilyRow = {
  id: "f1",
  name: "TestFamily",
  inviteCode: "ABC123",
  ownerId: "u1",
} as FamilyRow;

const ownerMembership: FamilyMemberRow = {
  id: "m1",
  familyId: "f1",
  userId: "u1",
  displayName: "me",
  role: "OWNER",
} as FamilyMemberRow;

const otherMember: FamilyMemberRow = {
  id: "m2",
  familyId: "f1",
  userId: "u2",
  displayName: "partner",
  role: "MEMBER",
} as FamilyMemberRow;

describe( "FamilyScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState( {
      removeMember: mockedRemoveMember,
      leaveFamily: mockedLeaveFamily,
    } );
    jest.spyOn( Alert, "alert" ).mockImplementation( (_title, _msg, buttons) => {
      const confirmButton = buttons?.find( b => b.style === "destructive" );
      confirmButton?.onPress?.();
    } );
  } );

  afterEach( () => {
    jest.restoreAllMocks();
  } );

  // FamilyScreen은 드로워를 통해서만(=이미 가족에 속해 있을 때만) 도달하므로
  // 온보딩 분기 없이 항상 가족 홈(멤버 관리) 화면을 그대로 보여준다.
  test( "가족 이름, 초대 코드, 멤버 목록을 표시한다", () => {
    useFamilyStore.setState( {
      status: "joined",
      family,
      membership: ownerMembership,
      members: [ownerMembership, otherMember],
    } );
    const { getByText } = render( <FamilyScreen /> );
    expect( getByText( /TestFamily/ ) ).toBeTruthy();
    expect( getByText( "ABC123" ) ).toBeTruthy();
    expect( getByText( "me" ) ).toBeTruthy();
    expect( getByText( "partner" ) ).toBeTruthy();
  } );

  test( "소유자에게는 다른 멤버의 제거 버튼이 보인다", () => {
    useFamilyStore.setState( {
      status: "joined",
      family,
      membership: ownerMembership,
      members: [ownerMembership, otherMember],
    } );
    const { getByText, queryAllByText } = render( <FamilyScreen /> );
    expect( getByText( "제거" ) ).toBeTruthy();
    // 본인 행에는 제거 버튼이 없어야 함(제거 버튼은 1개만 존재)
    expect( queryAllByText( "제거" ) ).toHaveLength( 1 );
  } );

  test( "제거 버튼을 탭하면 확인 후 removeMember를 호출한다", async () => {
    useFamilyStore.setState( {
      status: "joined",
      family,
      membership: ownerMembership,
      members: [ownerMembership, otherMember],
    } );
    mockedRemoveMember.mockResolvedValue( undefined );
    const { getByText } = render( <FamilyScreen /> );
    fireEvent.press( getByText( "제거" ) );
    await waitFor( () =>
      expect( mockedRemoveMember ).toHaveBeenCalledWith( "m2" ),
    );
  } );

  test( "가족 떠나기를 탭하면 확인 후 leaveFamily를 호출한다", async () => {
    useFamilyStore.setState( {
      status: "joined",
      family,
      membership: otherMember,
      members: [ownerMembership, otherMember],
    } );
    mockedLeaveFamily.mockResolvedValue( undefined );
    const { getByText } = render( <FamilyScreen /> );
    fireEvent.press( getByText( "가족 떠나기" ) );
    await waitFor( () => expect( mockedLeaveFamily ).toHaveBeenCalled() );
  } );
} );
