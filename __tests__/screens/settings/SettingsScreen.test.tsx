import React from "react";
import { Linking } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../../../src/screens/settings/SettingsScreen";
import {
  deleteAccount,
  getAuthErrorMessage,
  PRIVACY_POLICY_URL,
  signOutUser,
} from "../../../actions";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { StyleSheet, Platform } from "react-native";
import { act } from "@testing-library/react-native";
import {
  useFamilyStore,
  type FamilyMemberRow,
} from "../../../src/store/useFamilyStore";
import { useMascotStore, type MascotRow } from "../../../src/store/useMascotStore";
import { commonColor } from "../../../src/styles/commonStyle";

jest.mock( "react-native-android-widget", () => ( {
  getWidgetInfo: jest.fn( () => Promise.resolve( [] ) ),
  requestWidgetUpdate: jest.fn(),
  FlexWidget: () => null,
  TextWidget: () => null,
  SvgWidget: () => null,
} ) );

const me = { id: "me", userId: "u1", displayName: "수민", role: "OWNER" } as FamilyMemberRow;
const other = { id: "o", userId: "u2", displayName: "민수", role: "MEMBER" } as FamilyMemberRow;

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
  signOutUser: jest.fn(),
  deleteAccount: jest.fn(),
  getAuthErrorMessage: jest.fn(),
} ) );

const mockedSignOutUser = signOutUser as jest.Mock;
const mockedDeleteAccount = deleteAccount as jest.Mock;
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
    resetAllStores();
    useFamilyStore.setState( { membership: me, members: [me, other] } );
    useMascotStore.setState( {
      status: "created",
      mascot: { id: "m", earStyle: "ROUND", tailStyle: "STRAIGHT", happiness: 150 } as MascotRow,
    } );
    mockedGetAuthErrorMessage.mockImplementation( (err: Error) => err.message );
  } );

  test( "프로필 카드에 내 이름, 묶음이 순서대로 (우리집 → 앱 → 로그아웃)", () => {
    const { getByText, toJSON } = renderSettingsScreen();
    expect( getByText( "수민" ) ).toBeTruthy();
    expect( getByText( "Google 계정으로 로그인 중" ) ).toBeTruthy();
    expect( getByText( "2명" ) ).toBeTruthy();
    expect( getByText( "추억 Lv.2" ) ).toBeTruthy();

    const tree = JSON.stringify( toJSON() );
    const order = [
      "settings-profile",
      "settings-group-home",
      "settings-group-app",
      "settings-group-signout",
    ].map( id => tree.indexOf( id ) );
    expect( order ).toEqual( [...order].sort( (a, b) => a - b ) );
    expect( order.every( i => i >= 0 ) ).toBe( true );
    expect( tree.indexOf( "회원 탈퇴" ) ).toBeGreaterThan( order[3] );
  } );

  test( "Android면 우리집 다음에 홈 화면 위젯 묶음", () => {
    jest.replaceProperty( Platform, "OS", "android" );
    const { toJSON } = renderSettingsScreen();
    const tree = JSON.stringify( toJSON() );
    expect( tree.indexOf( "settings-group-widget" ) ).toBeGreaterThan( tree.indexOf( "settings-group-home" ) );
    expect( tree.indexOf( "settings-group-widget" ) ).toBeLessThan( tree.indexOf( "settings-group-app" ) );
    jest.restoreAllMocks();
  } );

  test( "로그아웃은 빨간 글자가 아니다", () => {
    const { getByText } = renderSettingsScreen();
    const style = StyleSheet.flatten( getByText( "로그아웃" ).props.style );
    expect( style.color ).not.toBe( commonColor.error );
  } );

  test( "'로그아웃'만 눌러서는 signOutUser가 불리지 않고, 확인 시트에서 확인해야 불린다", async () => {
    mockedSignOutUser.mockResolvedValueOnce( undefined );
    const { getByTestId, getByText } = renderSettingsScreen();
    fireEvent.press( getByTestId( "settings-signout" ) );

    expect( mockedSignOutUser ).not.toHaveBeenCalled();
    expect( getByText( "로그아웃할까요?" ) ).toBeTruthy();
    expect( getByText( "다시 Google로 로그인하면 지금 그대로 이어서 쓸 수 있어요." ) ).toBeTruthy();

    await act( async () => {
      fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
    } );
    expect( mockedSignOutUser ).toHaveBeenCalledTimes( 1 );
  } );

  test( "로그아웃 실패 시 에러 메시지를 표시한다", async () => {
    mockedSignOutUser.mockRejectedValueOnce(
      new Error( "로그아웃에 실패했습니다." ),
    );
    const { getByText, getByTestId } = renderSettingsScreen();
    fireEvent.press( getByTestId( "settings-signout" ) );
    fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
    await waitFor( () =>
      expect( getByText( "로그아웃에 실패했습니다." ) ).toBeTruthy(),
    );
  } );

  test( "'내 마스코트'를 누르면 MascotDetail로", () => {
    const { getByText, navigation } = renderSettingsScreen();
    fireEvent.press( getByText( "내 마스코트" ) );
    expect( navigation.navigate ).toHaveBeenCalledWith( "MascotDetail" );
  } );

  test( "이름 바꾸기: 지금 이름이 들어 있고, 저장하면 updateMyDisplayName → 카드 이름이 바뀐다", async () => {
    const updateMyDisplayName = jest.fn( ( name: string ) => {
      useFamilyStore.setState( { membership: { ...me, displayName: name } } );
      return Promise.resolve( true );
    } );
    useFamilyStore.setState( { updateMyDisplayName } );
    const { getByText, getByLabelText, queryByText } = renderSettingsScreen();

    fireEvent.press( getByText( "이름 바꾸기" ) );
    const input = getByLabelText( "가족에게 보이는 이름" );
    expect( input.props.value ).toBe( "수민" );

    fireEvent.changeText( input, "  수민2  " );
    await act( async () => {
      fireEvent( input, "submitEditing" );
    } );

    expect( updateMyDisplayName ).toHaveBeenCalledWith( "수민2" );
    expect( getByText( "수민2" ) ).toBeTruthy();
    expect( queryByText( "가족에게 보이는 이름" ) ).toBeNull();
  } );

  test( "이름이 비어 있으면 저장되지 않는다", () => {
    const updateMyDisplayName = jest.fn();
    useFamilyStore.setState( { updateMyDisplayName } );
    const { getByText, getByLabelText, getByTestId } = renderSettingsScreen();

    fireEvent.press( getByText( "이름 바꾸기" ) );
    fireEvent.changeText( getByLabelText( "가족에게 보이는 이름" ), "   " );
    fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
    fireEvent( getByLabelText( "가족에게 보이는 이름" ), "submitEditing" );

    expect( updateMyDisplayName ).not.toHaveBeenCalled();
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

  test( "'회원 탈퇴'를 누르면 탈퇴 화면으로 간다 (바로 지우지 않는다)", () => {
    const { getByText, navigation } = renderSettingsScreen();
    fireEvent.press( getByText( "회원 탈퇴" ) );
    expect( navigation.navigate ).toHaveBeenCalledWith( "AccountDelete" );
    expect( mockedDeleteAccount ).not.toHaveBeenCalled();
  } );
} );
