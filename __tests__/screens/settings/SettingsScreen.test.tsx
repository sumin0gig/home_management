import React from "react";
import { Linking } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../../../src/screens/settings/SettingsScreen";
import {
  getAuthErrorMessage,
  PRIVACY_POLICY_URL,
  signOutUser,
} from "../../../actions";
import { createMockNavigation } from "../../../src/test-utils/navigation";

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
  signOutUser: jest.fn(),
  getAuthErrorMessage: jest.fn(),
} ) );

const mockedSignOutUser = signOutUser as jest.Mock;
const mockedGetAuthErrorMessage = getAuthErrorMessage as jest.Mock;

function renderSettingsScreen(
  navigation = createMockNavigation<"SettingsMain">(),
) {
  return {
    ...render( <SettingsScreen navigation={ navigation } route={ {} as never } /> ),
    navigation,
  };
}

describe( "SettingsScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    mockedGetAuthErrorMessage.mockImplementation( (err: Error) => err.message );
  } );

  test( "로그아웃 메뉴를 표시한다", () => {
    const { getByText } = renderSettingsScreen();
    expect( getByText( "로그아웃" ) ).toBeTruthy();
  } );

  test( "로그아웃 메뉴를 탭하면 signOutUser를 호출한다", () => {
    mockedSignOutUser.mockResolvedValueOnce( undefined );
    const { getByText } = renderSettingsScreen();
    fireEvent.press( getByText( "로그아웃" ) );
    expect( mockedSignOutUser ).toHaveBeenCalledTimes( 1 );
  } );

  test( "로그아웃 실패 시 에러 메시지를 표시한다", async () => {
    mockedSignOutUser.mockRejectedValueOnce(
      new Error( "로그아웃에 실패했습니다." ),
    );
    const { getByText } = renderSettingsScreen();
    fireEvent.press( getByText( "로그아웃" ) );
    await waitFor( () =>
      expect( getByText( "로그아웃에 실패했습니다." ) ).toBeTruthy(),
    );
  } );

  test( "가족 관리 메뉴를 탭하면 가족 탭으로 이동한다", () => {
    const { getByText, navigation } = renderSettingsScreen();
    fireEvent.press( getByText( "가족 관리" ) );
    expect( navigation.navigate ).toHaveBeenCalledWith( "FamilyMain" );
  } );

  test( "개인정보처리방침 메뉴를 탭하면 방침 URL을 연다", () => {
    const openURL = jest.spyOn( Linking, "openURL" ).mockResolvedValueOnce( true );
    const { getByText } = renderSettingsScreen();
    fireEvent.press( getByText( "개인정보처리방침" ) );
    expect( openURL ).toHaveBeenCalledWith( PRIVACY_POLICY_URL );
  } );

  test( "개인정보처리방침을 열 수 없으면 에러 메시지를 표시한다", async () => {
    jest
      .spyOn( Linking, "openURL" )
      .mockRejectedValueOnce( new Error( "no browser" ) );
    const { getByText } = renderSettingsScreen();
    fireEvent.press( getByText( "개인정보처리방침" ) );
    await waitFor( () =>
      expect( getByText( "개인정보처리방침을 열 수 없습니다." ) ).toBeTruthy(),
    );
  } );
} );
