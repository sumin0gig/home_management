import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import WanderingMascot from "../../../src/components/Mascot/WanderingMascot";
import type { MascotConfig } from "../../../src/components/Mascot/types";

// jest의 reanimated는 withTiming을 즉시 끝내고 완료 콜백을 동기로 불러서,
// "도착 → 다음 구간 출발"이 끝없이 이어진다. 완료 콜백을 모아 두었다가
// 테스트가 한 구간씩 직접 끝내도록 withTiming/runOnJS를 대체한다.
const mockPendingArrivals: Array<( finished: boolean ) => void> = [];

jest.mock( "react-native-reanimated", () => {
  const actual = jest.requireActual( "react-native-reanimated" );
  return {
    ...actual,
    __esModule: true,
    default: actual.default,
    withTiming: (
      toValue: number,
      _config: unknown,
      callback?: ( finished: boolean ) => void,
    ) => {
      if (callback) {
        mockPendingArrivals.push( callback );
      }
      return toValue;
    },
    runOnJS: ( fn: () => void ) => fn,
  };
} );

// 실제 SVG 대신 현재 action을 글자로 보여주고, 탭하면 행동이 끝난 것처럼
// onActionEnd를 호출하는 가짜 Mascot.
jest.mock( "../../../src/components/Mascot/Mascot", () => {
  const { Pressable, Text } = require( "react-native" );
  return {
    __esModule: true,
    default: ( {
      action,
      onActionEnd,
    }: {
      action: string;
      onActionEnd?: () => void;
    } ) => (
      <Pressable testID="mascot-end" onPress={ onActionEnd }>
        <Text testID="mascot-action">{ action }</Text>
      </Pressable>
    ),
  };
} );

const config: MascotConfig = { earStyle: "round", tailStyle: "straight" };
const bounds = { width: 400, height: 300 };

// 지금 이동 중인 구간을 끝내서 목적지에 도착시킨다.
function arrive() {
  const callback = mockPendingArrivals.shift();
  expect( callback ).toBeDefined();
  act( () => callback?.( true ) );
}

describe( "WanderingMascot", () => {
  let randomSpy: jest.SpyInstance;

  beforeEach( () => {
    mockPendingArrivals.length = 0;
  } );

  afterEach( () => {
    randomSpy.mockRestore();
  } );

  test( "목적지에 도착하면 확률에 따라 행동을 하고, 끝나면 다시 걷는다", () => {
    // 0 → 행동 확률 통과 + 목록의 첫 행동 선택
    randomSpy = jest.spyOn( Math, "random" ).mockReturnValue( 0 );
    const { getByTestId, getByText } = render(
      <WanderingMascot config={ config } bounds={ bounds } actions={ ["wag"] } />,
    );
    expect( getByText( "walk" ) ).toBeTruthy();

    arrive();
    expect( getByText( "wag" ) ).toBeTruthy();
    // 행동 중에는 다음 구간으로 출발하지 않는다.
    expect( mockPendingArrivals ).toHaveLength( 0 );

    fireEvent.press( getByTestId( "mascot-end" ) );
    expect( getByText( "walk" ) ).toBeTruthy();
    expect( mockPendingArrivals ).toHaveLength( 1 );
  } );

  test( "확률에 걸리지 않으면 계속 걷는다", () => {
    randomSpy = jest.spyOn( Math, "random" ).mockReturnValue( 0.99 );
    const { getByText } = render(
      <WanderingMascot config={ config } bounds={ bounds } actions={ ["wag"] } />,
    );

    arrive();
    arrive();
    expect( getByText( "walk" ) ).toBeTruthy();
    expect( mockPendingArrivals ).toHaveLength( 1 );
  } );

  test( "할 수 있는 행동이 없으면 걷기만 한다", () => {
    randomSpy = jest.spyOn( Math, "random" ).mockReturnValue( 0 );
    const { getByText } = render(
      <WanderingMascot config={ config } bounds={ bounds } actions={ [] } />,
    );

    arrive();
    expect( getByText( "walk" ) ).toBeTruthy();
    expect( mockPendingArrivals ).toHaveLength( 1 );
  } );

  test( "언마운트된 뒤 도착해도 다음 구간을 시작하지 않는다", () => {
    randomSpy = jest.spyOn( Math, "random" ).mockReturnValue( 0.99 );
    const { unmount } = render(
      <WanderingMascot config={ config } bounds={ bounds } actions={ ["wag"] } />,
    );

    unmount();
    const callback = mockPendingArrivals.shift();
    callback?.( true );
    expect( mockPendingArrivals ).toHaveLength( 0 );
  } );
} );
