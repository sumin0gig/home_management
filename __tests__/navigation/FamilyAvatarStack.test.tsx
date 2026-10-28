import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  FamilyAvatarStack,
  avatarColor,
  avatarInitials,
} from "../../src/navigation/FamilyAvatarStack";
import {
  useFamilyStore,
  type FamilyMemberRow,
} from "../../src/store/useFamilyStore";
import { resetAllStores } from "../../src/test-utils/resetStores";
import { ROOM_COLOR_PALETTE } from "../../src/styles/commonStyle";

function member( id: string, displayName: string ): FamilyMemberRow {
  return { id, familyId: "f1", userId: id, displayName } as FamilyMemberRow;
}

function renderStack() {
  const onOpenFamily = jest.fn();
  const onInvite = jest.fn();
  const utils = render(
    <FamilyAvatarStack onOpenFamily={ onOpenFamily } onInvite={ onInvite } />,
  );
  return { ...utils, onOpenFamily, onInvite };
}

describe( "FamilyAvatarStack", () => {
  beforeEach( () => {
    resetAllStores();
  } );

  test( "구성원 이름 앞글자를 원으로 보여주고, 누르면 가족 화면을 연다", () => {
    useFamilyStore.setState( { members: [member( "m1", "수민" ), member( "m2", "Alex" )] } );

    const { getByText, getByLabelText, queryByLabelText, onOpenFamily } = renderStack();

    expect( getByText( "수" ) ).toBeTruthy();
    expect( getByText( "Al" ) ).toBeTruthy();
    fireEvent.press( getByLabelText( "가족 2명, 가족 화면 열기" ) );
    expect( onOpenFamily ).toHaveBeenCalled();
    // 두 명 이상이면 초대 원은 없다
    expect( queryByLabelText( "가족 초대하기" ) ).toBeNull();
  } );

  test( "3명이 넘으면 원은 3개까지, 마지막 원에 +N", () => {
    useFamilyStore.setState( {
      members: [
        member( "m1", "가" ),
        member( "m2", "나" ),
        member( "m3", "다" ),
        member( "m4", "라" ),
        member( "m5", "마" ),
      ],
    } );

    const { getByText, queryByText, getByLabelText } = renderStack();

    expect( getByText( "가" ) ).toBeTruthy();
    expect( getByText( "나" ) ).toBeTruthy();
    expect( queryByText( "다" ) ).toBeNull();
    expect( getByText( "+3" ) ).toBeTruthy();
    expect( getByLabelText( "가족 5명, 가족 화면 열기" ) ).toBeTruthy();
  } );

  test( "나 혼자면 점선 '+' 원을 덧붙이고, 그 원은 가족 초대로 간다", () => {
    useFamilyStore.setState( { members: [member( "m1", "수민" )] } );

    const { getByLabelText, onInvite, onOpenFamily } = renderStack();
    fireEvent.press( getByLabelText( "가족 초대하기" ) );

    expect( onInvite ).toHaveBeenCalled();
    expect( onOpenFamily ).not.toHaveBeenCalled();
  } );

  test( "구성원이 없으면(가족을 불러오기 전) 아무것도 그리지 않는다", () => {
    const { toJSON } = renderStack();
    expect( toJSON() ).toBeNull();
  } );

  test( "배경색은 구성원 id로 팔레트에서 늘 같은 색을 고른다", () => {
    expect( avatarColor( "abc" ) ).toBe( avatarColor( "abc" ) );
    expect( ROOM_COLOR_PALETTE ).toContain( avatarColor( "abc" ) );
  } );

  test( "이름이 비어 있으면 ?", () => {
    expect( avatarInitials( "  " ) ).toBe( "?" );
  } );
} );
