import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import FamilyOnboarding from "../../../../../src/components/FamilyOnboarding/FamilyOnboarding";
import { ensureUserExists, signOutUser } from "../../../../../actions";
import {
  useFamilyStore,
  type FamilyLookup,
  type FamilyRow,
} from "../../../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../../../src/test-utils/resetStores";

jest.mock( "../../../../../actions", () => ( {
  ...jest.requireActual( "../../../../../actions" ),
  signOutUser: jest.fn(),
  ensureUserExists: jest.fn(),
} ) );

const mockedCreateFamily = jest.fn();
const mockedJoinFamily = jest.fn();
const mockedLookup = jest.fn();
const mockedSignOutUser = signOutUser as jest.Mock;
const mockedEnsureUserExists = ensureUserExists as jest.Mock;

const lookup: FamilyLookup = {
  family: { id: "f2", name: "민수네", inviteCode: "K7Q2MX", ownerId: "u2" } as FamilyRow,
  ownerName: "민수",
  memberCount: 2,
  roomCount: 5,
};

function renderOnboarding() {
  return render(
    <NavigationContainer>
      <FamilyOnboarding />
    </NavigationContainer>,
  );
}

describe( "FamilyOnboarding", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    mockedEnsureUserExists.mockResolvedValue( undefined );
    useFamilyStore.setState( {
      createFamily: mockedCreateFamily,
      joinFamily: mockedJoinFamily,
      lookupFamilyByCode: mockedLookup,
    } );
  } );

  test( "사용자 등록 중에는 시작 화면, 끝나면 고르기 화면", async () => {
    const { getByTestId, getByText } = renderOnboarding();
    expect( getByTestId( "startup-screen" ) ).toBeTruthy();
    await waitFor( () => expect( getByText( "어떻게 시작할까요?" ) ).toBeTruthy() );
    expect( getByText( "새로 시작하기" ) ).toBeTruthy();
    expect( getByText( "초대받았어요" ) ).toBeTruthy();
  } );

  test( "맨 아래 '다른 계정으로 로그인'은 로그아웃한다", async () => {
    const { getByText } = renderOnboarding();
    await waitFor( () => getByText( "다른 계정으로 로그인" ) );
    fireEvent.press( getByText( "다른 계정으로 로그인" ) );
    expect( mockedSignOutUser ).toHaveBeenCalled();
  } );

  describe( "새로 시작하기", () => {
    async function openFamilyName() {
      const utils = renderOnboarding();
      await waitFor( () => utils.getByText( "새로 시작하기" ) );
      fireEvent.press( utils.getByText( "새로 시작하기" ) );
      await waitFor( () => utils.getByText( "가족 이름을 정해주세요" ) );
      return utils;
    }

    test( "가족 이름 입력칸의 기본값은 '우리집'이고, 엔터로 createFamily를 부른다", async () => {
      mockedCreateFamily.mockResolvedValue( true );
      const { getByLabelText } = await openFamilyName();

      const input = getByLabelText( "가족 이름" );
      expect( input.props.value ).toBe( "우리집" );
      await act( async () => {
        fireEvent( input, "submitEditing" );
      } );

      expect( mockedCreateFamily ).toHaveBeenCalledWith( "우리집" );
    } );

    test( "빈 값이면 엔터도 '다음'도 createFamily를 부르지 않는다", async () => {
      const { getByLabelText, getByText } = await openFamilyName();

      fireEvent.changeText( getByLabelText( "가족 이름" ), "   " );
      fireEvent( getByLabelText( "가족 이름" ), "submitEditing" );
      fireEvent.press( getByText( "다음" ) );

      expect( mockedCreateFamily ).not.toHaveBeenCalled();
    } );

    test( "진행 막대는 3칸 중 1칸", async () => {
      const { getByLabelText } = await openFamilyName();
      expect( getByLabelText( "3단계 중 1단계, 가족 이름" ) ).toBeTruthy();
    } );
  } );

  describe( "초대받았어요", () => {
    async function openInviteCode() {
      const utils = renderOnboarding();
      await waitFor( () => utils.getByText( "초대받았어요" ) );
      fireEvent.press( utils.getByText( "초대받았어요" ) );
      await waitFor( () => utils.getByText( "초대 코드를 입력해주세요" ) );
      return utils;
    }

    test( "코드 6자를 넣으면 자동으로 찾고, 바로 참여하지 않고 참여 확인을 보여준다", async () => {
      mockedLookup.mockResolvedValue( lookup );
      mockedJoinFamily.mockResolvedValue( true );
      const { getByTestId, getByText } = await openInviteCode();

      await act( async () => {
        fireEvent.changeText( getByTestId( "invite-code-input" ), "k7q2-mx" );
      } );

      expect( mockedLookup ).toHaveBeenCalledWith( "K7Q2MX" );
      await waitFor( () => getByText( "이 가족에 참여할까요?" ) );
      expect( mockedJoinFamily ).not.toHaveBeenCalled();
      expect( getByText( "민수네" ) ).toBeTruthy();
      expect( getByText( "관리자 민수 · 구성원 2명 · 방 5개" ) ).toBeTruthy();

      await act( async () => {
        fireEvent.press( getByText( "참여하기" ) );
      } );
      expect( mockedJoinFamily ).toHaveBeenCalledWith( "f2", "K7Q2MX" );
    } );

    test( "6자 미만이면 '확인'이 동작하지 않는다", async () => {
      const { getByTestId, getByText } = await openInviteCode();
      fireEvent.changeText( getByTestId( "invite-code-input" ), "K7Q" );
      fireEvent.press( getByText( "확인" ) );
      expect( mockedLookup ).not.toHaveBeenCalled();
    } );

    test( "없는 코드면 칸 아래에 안내 문구", async () => {
      mockedLookup.mockResolvedValue( null );
      const { getByTestId, getByText } = await openInviteCode();

      await act( async () => {
        fireEvent.changeText( getByTestId( "invite-code-input" ), "AAAAAA" );
      } );

      await waitFor( () =>
        expect( getByText( "코드를 다시 확인해주세요. 대문자와 숫자 6자리예요." ) ).toBeTruthy(),
      );
    } );

    test( "참여 경로의 진행 막대는 2칸", async () => {
      const { getByLabelText } = await openInviteCode();
      expect( getByLabelText( "2단계 중 1단계, 초대 코드" ) ).toBeTruthy();
    } );
  } );
} );
