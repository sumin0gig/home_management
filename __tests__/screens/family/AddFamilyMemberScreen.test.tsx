import React from "react";
import { Share } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { fireEvent, render } from "@testing-library/react-native";
import { PLAY_STORE_URL } from "../../../actions";
import AddFamilyMemberScreen from "../../../src/screens/family/AddFamilyMemberScreen";
import { useFamilyStore } from "../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
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

    fireEvent.press( getByText( "공유" ) );

    expect( share ).toHaveBeenCalledWith( {
      message: [
        "우리집에 참여해 주세요!",
        `1) 앱 설치: ${PLAY_STORE_URL}`,
        "2) 앱을 열고 초대 코드 K7Q2MX 입력",
      ].join( "\n" ),
    } );
  } );

  test( "코드 복사를 누르면 초대 코드를 복사하고 \"복사했어요\"로 바뀐다", () => {
    const { getByText } = renderScreen();

    fireEvent.press( getByText( "코드 복사" ) );

    expect( Clipboard.setString ).toHaveBeenCalledWith( "K7Q2MX" );
    expect( getByText( "복사했어요" ) ).toBeTruthy();
  } );

  test( "버튼에 이모지가 없다", () => {
    const { queryByText } = renderScreen();

    expect( queryByText( /📋|📤/ ) ).toBeNull();
  } );
} );
