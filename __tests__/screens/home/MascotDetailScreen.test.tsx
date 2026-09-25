import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import MascotDetailScreen from "../../../src/screens/home/MascotDetailScreen";
import {
  useMascotStore,
  type MascotRow,
} from "../../../src/store/useMascotStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";

describe( "MascotDetailScreen", () => {
  beforeEach( () => {
    resetAllStores();
    useMascotStore.setState( {
      status: "created",
      mascot: {
        id: "m1",
        userId: "u1",
        earStyle: "ROUND",
        tailStyle: "STRAIGHT",
        happiness: 150,
      } as MascotRow,
    } );
  } );

  test( "추억 레벨을 보여주고, 누르면 추억 도감으로 이동한다", () => {
    const navigation = createMockNavigation<"MascotDetail">();
    const { getByText, getByTestId } = render(
      <MascotDetailScreen navigation={ navigation } route={ {} as never } />,
    );

    expect( getByText( "추억 Lv. 2" ) ).toBeTruthy();
    expect( getByText( "50 / 120" ) ).toBeTruthy();

    fireEvent.press( getByTestId( "memory-level-link" ) );
    expect( navigation.navigate ).toHaveBeenCalledWith( "MascotCollection" );
  } );
} );
