import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { getWidgetInfo } from "react-native-android-widget";
import { useWidgetInstalled } from "../../src/widget/useWidgetInstalled";

jest.mock( "react-native-android-widget", () => ( {
  getWidgetInfo: jest.fn(),
} ) );

const mockedGetWidgetInfo = getWidgetInfo as jest.Mock;

describe( "useWidgetInstalled", () => {
  const addEventListener = AppState.addEventListener as jest.Mock;
  let originalImplementation: ( ( ...args: never[] ) => unknown ) | undefined;
  let onAppStateChange: ( state: AppStateStatus ) => void;

  beforeEach( () => {
    mockedGetWidgetInfo.mockReset();
    jest.replaceProperty( Platform, "OS", "android" );
    originalImplementation = addEventListener.getMockImplementation();
    addEventListener.mockImplementation( ( _: string, listener: ( state: AppStateStatus ) => void ) => {
      onAppStateChange = listener;
      return { remove: jest.fn() };
    } );
  } );

  afterEach( () => {
    jest.restoreAllMocks();
    addEventListener.mockImplementation( originalImplementation );
  } );

  test( "위젯이 하나라도 있으면 true, 없으면 false", async () => {
    mockedGetWidgetInfo.mockResolvedValue( [] );
    const { result } = renderHook( () => useWidgetInstalled() );
    await waitFor( () => expect( result.current ).toBe( false ) );

    mockedGetWidgetInfo.mockResolvedValue( [{ widgetId: 1 }] );
    await act( async () => onAppStateChange( "active" ) );
    await waitFor( () => expect( result.current ).toBe( true ) );
  } );

  test( "화면 포커스 때 다시 확인한다", async () => {
    mockedGetWidgetInfo.mockResolvedValue( [] );
    let focus: () => void = () => {};
    const navigation = {
      addListener: jest.fn( ( _: "focus", callback: () => void ) => {
        focus = callback;
        return jest.fn();
      } ),
    };
    const { result } = renderHook( () => useWidgetInstalled( navigation ) );
    await waitFor( () => expect( result.current ).toBe( false ) );

    mockedGetWidgetInfo.mockResolvedValue( [{ widgetId: 1 }] );
    await act( async () => focus() );
    await waitFor( () => expect( result.current ).toBe( true ) );
  } );

  test( "iOS에서는 항상 null", () => {
    jest.replaceProperty( Platform, "OS", "ios" );
    const { result } = renderHook( () => useWidgetInstalled() );
    expect( result.current ).toBeNull();
    expect( mockedGetWidgetInfo ).not.toHaveBeenCalled();
  } );
} );
