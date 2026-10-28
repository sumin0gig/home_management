import React from "react";
import { render } from "@testing-library/react-native";
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
} );
