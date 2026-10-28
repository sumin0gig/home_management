import React from "react";
import { Linking } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../../src/screens/LoginScreen";
import { useAuthStore } from "../../src/store/useAuthStore";
import {
  getAuthErrorMessage,
  PRIVACY_POLICY_URL,
  signInWithGoogle,
} from "../../actions";

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  signInWithGoogle: jest.fn(),
  getAuthErrorMessage: jest.fn(),
} ) );

const mockedSignInWithGoogle = signInWithGoogle as jest.Mock;
const mockedGetAuthErrorMessage = getAuthErrorMessage as jest.Mock;

describe( "LoginScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    mockedGetAuthErrorMessage.mockImplementation( (err: Error) => err.message );
  } );

  test( "무슨 앱인지 알려주는 제목·설명과 로그인 버튼을 표시한다 (앱 이름·마스코트 없음)", () => {
    const { getByText, queryByText, toJSON, getByTestId } = render( <LoginScreen /> );
    expect( getByText( "집안일을 정리해요" ) ).toBeTruthy();
    expect( getByText( /방마다 할 일을 정리하고/ ) ).toBeTruthy();
    expect( getByText( "Google로 계속하기" ) ).toBeTruthy();
    expect( getByTestId( "floor-plan-illustration", { includeHiddenElements: true } ) ).toBeTruthy();
    expect( queryByText( /HomeManagement/ ) ).toBeNull();
    expect( JSON.stringify( toJSON() ) ).not.toMatch( /mascot/i );

    // 제목이 설명보다 위
    const texts = JSON.stringify( toJSON() );
    expect( texts.indexOf( "집안일을 정리해요" ) ).toBeLessThan( texts.indexOf( "방마다 할 일을" ) );
  } );

  test( "버튼을 탭하면 signInWithGoogle을 호출한다", () => {
    mockedSignInWithGoogle.mockResolvedValueOnce( undefined );
    const { getByText } = render( <LoginScreen /> );
    fireEvent.press( getByText( "Google로 계속하기" ) );
    expect( mockedSignInWithGoogle ).toHaveBeenCalledTimes( 1 );
  } );

  test( "로그인 실패 시 에러 메시지를 표시한다", async () => {
    mockedSignInWithGoogle.mockRejectedValueOnce(
      new Error( "로그인에 실패했습니다." ),
    );
    const { getByText } = render( <LoginScreen /> );
    fireEvent.press( getByText( "Google로 계속하기" ) );
    await waitFor( () =>
      expect( getByText( "로그인에 실패했습니다." ) ).toBeTruthy(),
    );
  } );

  test( "개인정보처리방침 링크를 탭하면 방침 URL을 연다", () => {
    const openURL = jest.spyOn( Linking, "openURL" ).mockResolvedValueOnce( true );
    const { getByText } = render( <LoginScreen /> );
    fireEvent.press( getByText( "개인정보처리방침" ) );
    expect( openURL ).toHaveBeenCalledWith( PRIVACY_POLICY_URL );
  } );

  test( "회원 탈퇴 직후에는 완료 안내를 한 번 보여주고, '처음 화면으로'를 누르면 로그인 화면", () => {
    useAuthStore.setState( { accountDeleted: true } );
    const { getByText, queryByText } = render( <LoginScreen /> );

    expect( getByText( "탈퇴가 끝났어요" ) ).toBeTruthy();
    expect( getByText( "그동안 함께해줘서 고마워요." ) ).toBeTruthy();
    expect( queryByText( "Google로 계속하기" ) ).toBeNull();

    fireEvent.press( getByText( "처음 화면으로" ) );
    expect( useAuthStore.getState().accountDeleted ).toBe( false );
    expect( getByText( "Google로 계속하기" ) ).toBeTruthy();
  } );
} );
