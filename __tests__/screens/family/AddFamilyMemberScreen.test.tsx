import React from "react";
import { Share } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { fireEvent, render } from "@testing-library/react-native";
import { PLAY_STORE_URL } from "../../../actions";
import AddFamilyMemberScreen from "../../../src/screens/family/AddFamilyMemberScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import Toast from "react-native-root-toast";

jest.mock( "react-native-root-toast", () => ( {
  __esModule: true,
  default: { show: jest.fn(), durations: { SHORT: 2000 } },
} ) );
import type { FamilyRow } from "../../../src/store/useFamilyStore";

const family: FamilyRow = {
  id: "f1",
  name: "우리집",
  inviteCode: "K7Q2MX",
  ownerId: "u1",
} as FamilyRow;

function renderScreen( navigation = createMockNavigation<"AddFamilyMember">() ) {
  return {
    ...render(
      <AddFamilyMemberScreen navigation={ navigation } route={ {} as never } />,
    ),
    navigation,
  };
}

describe( "AddFamilyMemberScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useFamilyStore.setState( { status: "joined", family } );
  } );

  test( "초대 화면에는 다른 가족에 참여하는 버튼이 없다", () => {
    const { queryByText } = renderScreen();

    expect( queryByText( "가족 추가" ) ).toBeNull();
    expect( queryByText( "QR 코드를 스캔한다" ) ).toBeNull();
    expect( queryByText( "가족 코드 입력" ) ).toBeNull();
  } );

  test( "공유 메시지에 Play 스토어 링크와 초대 코드가 들어 있다", () => {
    const share = jest
    .spyOn( Share, "share" )
    .mockResolvedValue( { action: "sharedAction" } );
    const { getByText } = renderScreen();

    fireEvent.press( getByText( "초대 메시지 보내기" ) );

    expect( share ).toHaveBeenCalledWith( {
      message: [
        "우리집에 참여해 주세요!",
        `1) 앱 설치: ${PLAY_STORE_URL}`,
        "2) 앱을 열고 초대 코드 K7Q2MX 입력",
      ].join( "\n" ),
    } );
  } );

  test( "코드 복사를 누르면 초대 코드를 복사하고 \"복사했어요\" 토스트", () => {
    const { getByText } = renderScreen();

    fireEvent.press( getByText( "코드 복사" ) );

    expect( Clipboard.setString ).toHaveBeenCalledWith( "K7Q2MX" );
    expect( Toast.show ).toHaveBeenCalledWith( "복사했어요", expect.any( Object ) );
  } );

  test( "제목, 초대 코드, 보내는 메시지 미리보기가 있고 이모지가 없다", () => {
    const { getByText, getByTestId, queryAllByText } = renderScreen();

    expect( getByText( "함께 집안일을 나눌 가족을 초대하세요" ) ).toBeTruthy();
    expect( getByText( "K7Q2MX" ) ).toBeTruthy();
    expect( getByTestId( "invite-message-preview" ) ).toHaveTextContent( /2\) 앱을 열고 초대 코드 K7Q2MX 입력/ );
    expect( queryAllByText( /\p{Extended_Pictographic}/u ) ).toHaveLength( 0 );
  } );

  test( "화면 제목은 '가족 초대'", () => {
    const { navigation } = renderScreen();
    expect( navigation.setOptions ).toHaveBeenCalledWith( { title: "가족 초대" } );
  } );
} );
