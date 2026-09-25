import React from "react";
import { render, within } from "@testing-library/react-native";
import MascotCollectionScreen from "../../../src/screens/home/MascotCollectionScreen";
import {
  useMascotStore,
  type MascotRow,
} from "../../../src/store/useMascotStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";

// 레벨 구간: 100, 120, 144, 173, 208, ... (computeHappinessLevel)
// → Lv. 5 시작 = 537, Lv. 20 시작 = 15533
const HAPPINESS_LV5 = 537;
const HAPPINESS_LV20 = 15533;

function seedMascot( happiness: number ) {
  useMascotStore.setState( {
    status: "created",
    mascot: {
      id: "m1",
      userId: "u1",
      earStyle: "ROUND",
      tailStyle: "STRAIGHT",
      happiness,
    } as MascotRow,
  } );
}

function renderScreen() {
  return render(
    <MascotCollectionScreen
      navigation={ createMockNavigation<"MascotCollection">() }
      route={ {} as never }
    />,
  );
}

describe( "MascotCollectionScreen", () => {
  beforeEach( () => {
    resetAllStores();
  } );

  test( "개방된 행동은 이름을, 잠긴 행동은 ???와 필요 레벨을 보여준다", () => {
    seedMascot( HAPPINESS_LV5 );
    const { getByText, getByTestId } = renderScreen();

    expect( getByText( "추억 Lv. 5" ) ).toBeTruthy();
    expect( getByText( "개방한 행동 1 / 4" ) ).toBeTruthy();
    expect( getByText( "Lv. 10에 새 행동이 열려요" ) ).toBeTruthy();

    const wag = within( getByTestId( "collection-item-wag" ) );
    expect( wag.getByText( "꼬리 흔들기" ) ).toBeTruthy();
    expect( wag.getByText( "Lv. 5 개방" ) ).toBeTruthy();

    const stretch = within( getByTestId( "collection-item-stretch" ) );
    expect( stretch.getByText( "???" ) ).toBeTruthy();
    expect( stretch.getByText( "추억 Lv. 10 달성 시 개방" ) ).toBeTruthy();
    expect( stretch.queryByText( "기지개" ) ).toBeNull();
  } );

  test( "기본 행동(happy)은 도감에 없다", () => {
    seedMascot( 0 );
    const { queryByTestId, getByText } = renderScreen();

    expect( queryByTestId( "collection-item-happy" ) ).toBeNull();
    expect( getByText( "개방한 행동 0 / 4" ) ).toBeTruthy();
    expect( getByText( "Lv. 5에 새 행동이 열려요" ) ).toBeTruthy();
  } );

  test( "모든 행동을 개방하면 안내 문구가 바뀐다", () => {
    seedMascot( HAPPINESS_LV20 );
    const { getByText, queryByText } = renderScreen();

    expect( getByText( "개방한 행동 4 / 4" ) ).toBeTruthy();
    expect( getByText( "모든 행동을 개방했어요" ) ).toBeTruthy();
    expect( queryByText( "???" ) ).toBeNull();
  } );
} );
