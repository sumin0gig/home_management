import {
  ACTION_CATALOG,
  getNextUnlock,
  getPlayableActions,
  getUnlockedActions,
} from "../../src/components/Mascot/actionCatalog";
import { computeHappinessLevel } from "../../src/utils/happiness";

describe( "ACTION_CATALOG", () => {
  test( "5레벨마다 순서대로 개방된다", () => {
    expect(
      ACTION_CATALOG.map( entry => [entry.action, entry.unlockLevel] ),
    ).toEqual( [
      ["wag", 5],
      ["stretch", 10],
      ["nap", 15],
      ["eat", 20],
    ] );
  } );

  test( "기본 행동(happy)은 도감에 포함되지 않는다", () => {
    expect( ACTION_CATALOG.map( entry => entry.action ) ).not.toContain(
      "happy",
    );
  } );
} );

describe( "getUnlockedActions", () => {
  test( "Lv. 5 전에는 개방된 도감 행동이 없다", () => {
    expect( getUnlockedActions( 1 ) ).toEqual( [] );
    expect( getUnlockedActions( 4 ) ).toEqual( [] );
  } );

  test( "개방 레벨에 도달하면 해당 행동이 열린다", () => {
    expect( getUnlockedActions( 5 ) ).toEqual( ["wag"] );
    expect( getUnlockedActions( 14 ) ).toEqual( ["wag", "stretch"] );
    expect( getUnlockedActions( 15 ) ).toEqual( ["wag", "stretch", "nap"] );
  } );

  test( "마지막 개방 레벨 이상이면 모든 행동이 열린다", () => {
    const all = ACTION_CATALOG.map( entry => entry.action );
    expect( getUnlockedActions( 20 ) ).toEqual( all );
    expect( getUnlockedActions( 99 ) ).toEqual( all );
  } );
} );

describe( "getPlayableActions", () => {
  test( "처음부터 happy는 할 수 있다", () => {
    expect( getPlayableActions( 1 ) ).toEqual( ["happy"] );
  } );

  test( "개방된 도감 행동이 기본 행동 뒤에 붙는다", () => {
    expect( getPlayableActions( 10 ) ).toEqual( ["happy", "wag", "stretch"] );
  } );
} );

describe( "getNextUnlock", () => {
  test( "다음에 개방될 행동을 알려준다", () => {
    expect( getNextUnlock( 1 )?.action ).toBe( "wag" );
    expect( getNextUnlock( 5 )?.action ).toBe( "stretch" );
    expect( getNextUnlock( 19 )?.action ).toBe( "eat" );
  } );

  test( "모든 행동을 개방했으면 null", () => {
    expect( getNextUnlock( 20 ) ).toBeNull();
  } );
} );

describe( "computeHappinessLevel", () => {
  test( "Lv. 1 구간은 100, 이후 1.2배씩 늘어난다", () => {
    expect( computeHappinessLevel( 0 ) ).toEqual( {
      level: 1,
      gaugeValue: 0,
      gaugeMax: 100,
    } );
    expect( computeHappinessLevel( 99 ).level ).toBe( 1 );
    expect( computeHappinessLevel( 100 ) ).toEqual( {
      level: 2,
      gaugeValue: 0,
      gaugeMax: 120,
    } );
    expect( computeHappinessLevel( 219 ).level ).toBe( 2 );
    expect( computeHappinessLevel( 220 ) ).toEqual( {
      level: 3,
      gaugeValue: 0,
      gaugeMax: 144,
    } );
  } );

  test( "음수는 0으로 취급한다", () => {
    expect( computeHappinessLevel( -10 ).level ).toBe( 1 );
  } );
} );
