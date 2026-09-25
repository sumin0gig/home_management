import React from "react";
import { act, render } from "@testing-library/react-native";
import Mascot from "../../../src/components/Mascot/Mascot";
import { ACTIONS } from "../../../src/components/Mascot/actions";
import type { MascotConfig } from "../../../src/components/Mascot/types";

const config: MascotConfig = { earStyle: "round", tailStyle: "straight" };

describe( "Mascot", () => {
  beforeEach( () => {
    jest.useFakeTimers();
  } );

  afterEach( () => {
    jest.useRealTimers();
  } );

  test( "one-shot 행동이 끝나면 onActionEnd를 호출한다", () => {
    const onActionEnd = jest.fn();
    render( <Mascot config={ config } action="wag" onActionEnd={ onActionEnd } /> );

    act( () => {
      jest.advanceTimersByTime( ( ACTIONS.wag.duration ?? 0 ) - 1 );
    } );
    expect( onActionEnd ).not.toHaveBeenCalled();

    act( () => {
      jest.advanceTimersByTime( 1 );
    } );
    expect( onActionEnd ).toHaveBeenCalledTimes( 1 );
  } );

  test( "반복 행동(walk)에서는 onActionEnd를 호출하지 않는다", () => {
    const onActionEnd = jest.fn();
    render( <Mascot config={ config } action="walk" onActionEnd={ onActionEnd } /> );

    act( () => {
      jest.advanceTimersByTime( 10000 );
    } );
    expect( onActionEnd ).not.toHaveBeenCalled();
  } );

  test( "행동이 끝나기 전에 다른 행동으로 바뀌면 이전 행동의 onActionEnd는 호출되지 않는다", () => {
    const onActionEnd = jest.fn();
    const { rerender } = render(
      <Mascot config={ config } action="nap" onActionEnd={ onActionEnd } />,
    );

    rerender(
      <Mascot config={ config } action="walk" onActionEnd={ onActionEnd } />,
    );
    act( () => {
      jest.advanceTimersByTime( ACTIONS.nap.duration ?? 0 );
    } );
    expect( onActionEnd ).not.toHaveBeenCalled();
  } );

  test( "부모가 새 콜백을 넘겨도 행동이 다시 시작되지 않고 최신 콜백이 호출된다", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(
      <Mascot config={ config } action="eat" onActionEnd={ first } />,
    );

    act( () => {
      jest.advanceTimersByTime( ( ACTIONS.eat.duration ?? 0 ) / 2 );
    } );
    rerender( <Mascot config={ config } action="eat" onActionEnd={ second } /> );
    act( () => {
      jest.advanceTimersByTime( ( ACTIONS.eat.duration ?? 0 ) / 2 );
    } );

    expect( first ).not.toHaveBeenCalled();
    expect( second ).toHaveBeenCalledTimes( 1 );
  } );
} );
