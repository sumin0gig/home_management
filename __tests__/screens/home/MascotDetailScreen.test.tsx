import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import Mascot from "../../../src/components/Mascot/Mascot";

jest.mock( "react-native-root-toast", () => ( {
  __esModule: true,
  default: { show: jest.fn(), durations: { SHORT: 2000 } },
} ) );
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

describe( "MascotDetailScreen 자동 저장", () => {
  const mockedUpdateMascot = jest.fn();

  beforeEach( () => {
    jest.useFakeTimers();
    resetAllStores();
    mockedUpdateMascot.mockReset();
    useMascotStore.setState( {
      status: "created",
      mascot: {
        id: "m1",
        userId: "u1",
        earStyle: "ROUND",
        tailStyle: "STRAIGHT",
        fillColor: "#FBD9A0",
        happiness: 0,
      } as MascotRow,
      updateMascot: mockedUpdateMascot,
    } );
  } );

  afterEach( () => {
    jest.useRealTimers();
  } );

  function renderDetail() {
    return render(
      <MascotDetailScreen
        navigation={ createMockNavigation<"MascotDetail">() }
        route={ {} as never }
      />,
    );
  }

  test( "저장 버튼이 없다", () => {
    const { queryByText } = renderDetail();
    expect( queryByText( "저장" ) ).toBeNull();
  } );

  test( "연속 3번 바꾸면 400ms 뒤 마지막 값으로 한 번만 저장한다", async () => {
    mockedUpdateMascot.mockResolvedValue( true );
    const { getByText } = renderDetail();

    fireEvent.press( getByText( "뾰족한 귀" ) );
    act( () => {
      jest.advanceTimersByTime( 200 );
    } );
    fireEvent.press( getByText( "늘어진 귀" ) );
    fireEvent.press( getByText( "둥근 귀" ) );
    expect( mockedUpdateMascot ).not.toHaveBeenCalled();

    await act( async () => {
      jest.advanceTimersByTime( 400 );
    } );

    expect( mockedUpdateMascot ).toHaveBeenCalledTimes( 1 );
    expect( mockedUpdateMascot ).toHaveBeenCalledWith( {
      earStyle: "ROUND",
      tailStyle: "STRAIGHT",
      fillColor: "#FBD9A0",
    } );
  } );

  test( "저장에 실패하면 마지막으로 저장된 값으로 되돌리고 오류를 보여준다", async () => {
    mockedUpdateMascot.mockImplementation( () => {
      useMascotStore.setState( { error: "마스코트 수정에 실패했습니다." } );
      return Promise.resolve( false );
    } );
    const { getByText, UNSAFE_getByType } = renderDetail();

    fireEvent.press( getByText( "뾰족한 귀" ) );
    expect( UNSAFE_getByType( Mascot ).props.config.earStyle ).toBe( "pointy" );

    await act( async () => {
      jest.advanceTimersByTime( 400 );
    } );

    expect( UNSAFE_getByType( Mascot ).props.config.earStyle ).toBe( "round" );
    expect( getByText( "마스코트 수정에 실패했습니다." ) ).toBeTruthy();
  } );

  test( "화면을 떠날 때 저장 대기 중인 값이 있으면 바로 저장한다", () => {
    mockedUpdateMascot.mockResolvedValue( true );
    const { getByText, unmount } = renderDetail();

    fireEvent.press( getByText( "꼬리 모양" ) );
    fireEvent.press( getByText( "말린 꼬리" ) );
    unmount();

    expect( mockedUpdateMascot ).toHaveBeenCalledWith(
      expect.objectContaining( { tailStyle: "CURLY" } ),
    );
  } );
} );
