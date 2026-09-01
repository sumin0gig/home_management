import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FamilyOnboarding from "../../../../../src/components/FamilyOnboarding/FamilyOnboarding";
import { signOutUser } from "../../../../../src/api/auth";
import { ensureUserExists } from "../../../../../src/api/user";
import { useFamilyStore } from "../../../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";

jest.mock( "../../../../../src/api/auth" );
jest.mock( "../../../../../src/api/user" );

const mockedCreateFamily = jest.fn();
const mockedJoinFamily = jest.fn();
const mockedSignOutUser = signOutUser as jest.Mock;
const mockedEnsureUserExists = ensureUserExists as jest.Mock;

describe( "FamilyOnboarding", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    mockedEnsureUserExists.mockResolvedValue( undefined );
    useFamilyStore.setState( {
      createFamily: mockedCreateFamily,
      joinFamily: mockedJoinFamily,
    } );
  } );

  test( "가족 이름이 없으면 만들기가 동작하지 않는다", async () => {
    const { getByText } = render( <FamilyOnboarding /> );
    await waitFor( () => expect( getByText( "만들기" ) ).toBeTruthy() );
    fireEvent.press( getByText( "만들기" ) );
    expect( mockedCreateFamily ).not.toHaveBeenCalled();
  } );

  test( "가족 이름을 입력하면 가족을 생성한다", async () => {
    mockedCreateFamily.mockResolvedValue( {
      id: "f1",
      name: "우리집",
      inviteCode: "ABC123",
      ownerId: "u1",
    } );

    const { getByText, getByPlaceholderText } = render( <FamilyOnboarding /> );
    await waitFor( () => expect( getByText( "만들기" ) ).toBeTruthy() );
    fireEvent.changeText( getByPlaceholderText( "가족 이름" ), "우리집" );
    fireEvent.press( getByText( "만들기" ) );

    await waitFor( () =>
      expect( mockedCreateFamily ).toHaveBeenCalledWith( "우리집" ),
    );
  } );

  test( "초대 코드가 없으면 참여하기가 동작하지 않는다", async () => {
    const { getByText } = render( <FamilyOnboarding /> );
    await waitFor( () => expect( getByText( "참여하기" ) ).toBeTruthy() );
    fireEvent.press( getByText( "참여하기" ) );
    expect( mockedJoinFamily ).not.toHaveBeenCalled();
  } );

  test( "초대 코드를 입력하면 가족에 참여한다", async () => {
    mockedJoinFamily.mockResolvedValue( undefined );

    const { getByText, getByPlaceholderText } = render( <FamilyOnboarding /> );
    await waitFor( () => expect( getByText( "참여하기" ) ).toBeTruthy() );
    fireEvent.changeText( getByPlaceholderText( "초대 코드" ), "ABC123" );
    fireEvent.press( getByText( "참여하기" ) );

    await waitFor( () =>
      expect( mockedJoinFamily ).toHaveBeenCalledWith( "ABC123" ),
    );
  } );

  test( "로그아웃 링크를 탭하면 signOutUser를 호출한다", async () => {
    mockedSignOutUser.mockResolvedValue( undefined );
    const { getByText } = render( <FamilyOnboarding /> );
    await waitFor( () => expect( getByText( "로그아웃" ) ).toBeTruthy() );
    fireEvent.press( getByText( "로그아웃" ) );
    expect( mockedSignOutUser ).toHaveBeenCalledTimes( 1 );
  } );
} );
