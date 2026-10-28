import React from "react";
import { render } from "@testing-library/react-native";
import { useReducedMotion } from "react-native-reanimated";
import Fireworks, {
  fireworkColors,
} from "../../../src/components/Celebration/Fireworks";
import { commonColor, ROOM_COLOR_PALETTE } from "../../../src/styles/commonStyle";

jest.mock( "react-native-reanimated", () => {
  const actual = jest.requireActual( "react-native-reanimated" );
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useReducedMotion: jest.fn( () => false ),
  };
} );

const mockedUseReducedMotion = useReducedMotion as jest.Mock;

describe( "Fireworks", () => {
  test( "움직임을 줄이지 않으면 세 번 터지고, 레벨이 오르면 한 번 더 터진다", () => {
    mockedUseReducedMotion.mockReturnValue( false );
    const { getAllByTestId, rerender } = render(
      <Fireworks size={ 320 } circleSize={ 200 } roomColor="#A9DDF2" />,
    );
    expect( getAllByTestId( "firework-burst" ) ).toHaveLength( 3 );

    rerender( <Fireworks size={ 320 } circleSize={ 200 } roomColor="#A9DDF2" leveledUp /> );
    expect( getAllByTestId( "firework-burst" ) ).toHaveLength( 4 );
  } );

  test( "움직임 줄이기면 움직이지 않는 반짝임만 그린다", () => {
    mockedUseReducedMotion.mockReturnValue( true );
    const { getAllByTestId, queryAllByTestId } = render(
      <Fireworks size={ 320 } circleSize={ 200 } leveledUp />,
    );
    expect( queryAllByTestId( "firework-burst" ) ).toHaveLength( 0 );
    expect( getAllByTestId( "firework-sparkle" ).length ).toBeGreaterThan( 0 );
  } );

  test( "색은 팔레트의 진한 쪽 4개 + touchable이고, 방 색과 같은 색은 뺀다", () => {
    const all = fireworkColors( null );
    expect( all ).toHaveLength( 5 );
    expect( all ).toContain( commonColor.touchable );
    all.filter( c => c !== commonColor.touchable ).forEach( c =>
      expect( ROOM_COLOR_PALETTE ).toContain( c ),
    );
    const roomColor = all[0];
    expect( fireworkColors( roomColor ) ).not.toContain( roomColor );
  } );
} );
