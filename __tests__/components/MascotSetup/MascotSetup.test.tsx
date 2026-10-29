import React from "react";
import { StyleSheet } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import MascotSetup from "../../../src/components/MascotSetup/MascotSetup";
import Mascot from "../../../src/components/Mascot/Mascot";
import {
  COLOR_OPTIONS,
  EAR_OPTIONS,
  TAIL_OPTIONS,
} from "../../../src/components/Mascot/optionMaps";
import { useMascotStore } from "../../../src/store/useMascotStore";
import { useFamilyStore, type FamilyMemberRow } from "../../../src/store/useFamilyStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";

const mockedCreateMascot = jest.fn( () => Promise.resolve( true ) );

describe( "MascotSetup", () => {
  beforeEach( () => {
    resetAllStores();
    useMascotStore.setState( { createMascot: mockedCreateMascot } );
  } );

  test( "미리보기에 원형 배경이 없다", () => {
    const { getByTestId } = render( <MascotSetup /> );
    const style = StyleSheet.flatten( getByTestId( "mascot-preview" ).props.style );
    expect( style.backgroundColor ).toBeUndefined();
    expect( style.borderRadius ).toBeUndefined();
  } );

  test( "'아무렇게나 골라줘'를 누르면 세 값이 목록 안의 값으로 바뀐다", async () => {
    const { getByText, UNSAFE_getByType } = render( <MascotSetup random={ () => 0.99 } /> );

    fireEvent.press( getByText( "아무렇게나 골라줘" ) );

    const config = UNSAFE_getByType( Mascot ).props.config;
    expect( EAR_OPTIONS.map( o => o.variant ) ).toContain( config.earStyle );
    expect( TAIL_OPTIONS.map( o => o.variant ) ).toContain( config.tailStyle );
    expect( COLOR_OPTIONS ).toContain( config.fillColor );
    // 마지막 선택지가 골라졌다
    expect( config.earStyle ).toBe( EAR_OPTIONS[EAR_OPTIONS.length - 1].variant );

    await act( async () => {
      fireEvent.press( getByText( "이 친구로 할게요" ) );
    } );
    expect( mockedCreateMascot ).toHaveBeenCalledWith( {
      earStyle: EAR_OPTIONS[EAR_OPTIONS.length - 1].value,
      tailStyle: TAIL_OPTIONS[TAIL_OPTIONS.length - 1].value,
      fillColor: COLOR_OPTIONS[COLOR_OPTIONS.length - 1],
    } );
  } );

  test( "진행 막대: 관리자는 3/3, 참여자는 2/2", () => {
    useFamilyStore.setState( { membership: { role: "OWNER" } as FamilyMemberRow } );
    const { getByLabelText, unmount } = render( <MascotSetup /> );
    expect( getByLabelText( "3단계 중 3단계, 마스코트" ) ).toBeTruthy();
    unmount();

    useFamilyStore.setState( { membership: { role: "MEMBER" } as FamilyMemberRow } );
    const { getByLabelText: getByLabel2 } = render( <MascotSetup /> );
    expect( getByLabel2( "2단계 중 2단계, 마스코트" ) ).toBeTruthy();
  } );
} );
