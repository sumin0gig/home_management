import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppState, Platform, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWidgetInfo, requestPinWidget } from "react-native-android-widget";
import WidgetPromptScreen from "../../src/screens/home/WidgetPromptScreen";
import HomeScreen from "../../src/screens/home/HomeScreen";
import {
  ONBOARDING_COMPLETED_AT_KEY,
  WIDGET_PROMPT_COOLDOWN_MS,
  WIDGET_PROMPT_DISMISSED_AT_KEY,
  canShowWidgetPrompt,
  markOpenedFromWidget,
  markWidgetPromptShown,
  resetWidgetPromptLaunchState,
  takeWidgetAddedNotice,
} from "../../src/widget/widgetPromptState";
import { useFamilyStore, type FamilyRow } from "../../src/store/useFamilyStore";
import { useRoomStore } from "../../src/store/useRoomStore";
import { useTaskStore } from "../../src/store/useTaskStore";
import { resetAllStores } from "../../src/test-utils/resetStores";
import { createMockNavigation } from "../../src/test-utils/navigation";

jest.mock( "react-native-android-widget", () => ( {
  getWidgetInfo: jest.fn(),
  requestPinWidget: jest.fn(),
  requestWidgetUpdate: jest.fn(),
  FlexWidget: () => null,
  TextWidget: () => null,
  SvgWidget: () => null,
} ) );

const mockedGetWidgetInfo = getWidgetInfo as jest.Mock;
const mockedRequestPinWidget = requestPinWidget as jest.Mock;

const DAY = 24 * 60 * 60 * 1000;

describe( "canShowWidgetPrompt", () => {
  beforeEach( async () => {
    await AsyncStorage.clear();
    resetWidgetPromptLaunchState();
  } );

  test( "처음이면 띄운다", async () => {
    await expect( canShowWidgetPrompt() ).resolves.toBe( true );
  } );

  test( "닫으면 7일 동안 안 뜬다", async () => {
    const now = Date.now();
    await AsyncStorage.setItem( WIDGET_PROMPT_DISMISSED_AT_KEY, String( now - 6 * DAY ) );
    await expect( canShowWidgetPrompt( now ) ).resolves.toBe( false );
    await expect( canShowWidgetPrompt( now + DAY + 1 ) ).resolves.toBe( true );
    expect( WIDGET_PROMPT_COOLDOWN_MS ).toBe( 7 * DAY );
  } );

  test( "이번 실행 중 이미 띄웠거나, 위젯으로 열렸으면 안 뜬다", async () => {
    markWidgetPromptShown();
    await expect( canShowWidgetPrompt() ).resolves.toBe( false );

    resetWidgetPromptLaunchState();
    markOpenedFromWidget();
    await expect( canShowWidgetPrompt() ).resolves.toBe( false );
  } );

  test( "이번 실행 중 온보딩을 마쳤으면 안 뜬다 (예전 실행이면 상관없다)", async () => {
    resetWidgetPromptLaunchState();
    await AsyncStorage.setItem( ONBOARDING_COMPLETED_AT_KEY, String( Date.now() + 1 ) );
    await expect( canShowWidgetPrompt() ).resolves.toBe( false );

    await AsyncStorage.setItem( ONBOARDING_COMPLETED_AT_KEY, String( Date.now() - 30 * DAY ) );
    await expect( canShowWidgetPrompt() ).resolves.toBe( true );
  } );
} );

describe( "WidgetPromptScreen", () => {
  const addEventListener = AppState.addEventListener as jest.Mock;
  let originalImplementation: ( ( ...args: never[] ) => unknown ) | undefined;
  let onAppStateChange: ( state: AppStateStatus ) => void;

  beforeEach( async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    resetAllStores();
    resetWidgetPromptLaunchState();
    originalImplementation = addEventListener.getMockImplementation();
    onAppStateChange = () => {};
    addEventListener.mockImplementation( ( _: string, listener: ( state: AppStateStatus ) => void ) => {
      onAppStateChange = listener;
      return { remove: jest.fn() };
    } );
  } );

  afterEach( () => {
    addEventListener.mockImplementation( originalImplementation );
  } );

  function renderPrompt() {
    const navigation = createMockNavigation<"WidgetPrompt">();
    return { ...render( <WidgetPromptScreen navigation={ navigation } route={ {} as never } /> ), navigation };
  }

  test( "오늘 할 일이 없으면 예시로 미리보기를 채운다", () => {
    const { getByText } = renderPrompt();
    expect( getByText( "설거지" ) ).toBeTruthy();
    expect( getByText( "앱을 열지 않아도\n오늘 할 일이 보여요" ) ).toBeTruthy();
  } );

  test( "✕를 누르면 닫은 시각을 기록하고 닫힌다", async () => {
    const { getByLabelText, navigation } = renderPrompt();
    fireEvent.press( getByLabelText( "닫기" ) );

    expect( navigation.goBack ).toHaveBeenCalled();
    await waitFor( async () =>
      expect( await AsyncStorage.getItem( WIDGET_PROMPT_DISMISSED_AT_KEY ) ).not.toBeNull(),
    );
  } );

  test( "requestPinWidget이 false면 직접 추가하는 방법과 '확인'을 보여준다", async () => {
    mockedRequestPinWidget.mockResolvedValue( false );
    const { getByText, getByTestId } = renderPrompt();

    await act( async () => {
      fireEvent.press( getByText( "위젯 추가하기" ) );
    } );

    expect( getByTestId( "widget-manual-steps" ) ).toBeTruthy();
    expect( getByText( "홈 화면 빈 곳을 길게 누르기" ) ).toBeTruthy();
    expect( getByText( "확인" ) ).toBeTruthy();
  } );

  test( "requestPinWidget이 true면 앱이 돌아왔을 때 설치가 확인되면 닫고 홈에 알린다", async () => {
    jest.replaceProperty( Platform, "OS", "android" );
    mockedRequestPinWidget.mockResolvedValue( true );
    const { getByText, navigation } = renderPrompt();

    await act( async () => {
      fireEvent.press( getByText( "위젯 추가하기" ) );
    } );
    expect( navigation.goBack ).not.toHaveBeenCalled();

    mockedGetWidgetInfo.mockResolvedValue( [{ widgetId: 1 }] );
    await act( async () => onAppStateChange( "active" ) );

    await waitFor( () => expect( navigation.goBack ).toHaveBeenCalled() );
    expect( takeWidgetAddedNotice() ).toBe( true );
    jest.restoreAllMocks();
  } );
} );

describe( "HomeScreen의 위젯 설치 안내", () => {
  const family = { id: "f1", name: "우리집" } as FamilyRow;

  beforeEach( async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    resetAllStores();
    resetWidgetPromptLaunchState();
    jest.replaceProperty( Platform, "OS", "android" );
    useFamilyStore.setState( { status: "joined", family } );
    useRoomStore.setState( { status: "loaded", rooms: [], fetchRooms: jest.fn() } );
    useTaskStore.setState( { status: "loaded", tasks: [], fetchTasksForFamily: jest.fn() } );
  } );

  afterEach( () => {
    jest.restoreAllMocks();
  } );

  function renderHome() {
    const navigation = createMockNavigation<"HomeMain">();
    ( navigation as unknown as { isFocused: jest.Mock } ).isFocused = jest.fn( () => true );
    render( <HomeScreen navigation={ navigation } route={ {} as never } /> );
    return navigation;
  }

  test( "위젯이 없으면 띄운다", async () => {
    mockedGetWidgetInfo.mockResolvedValue( [] );
    const navigation = renderHome();
    await waitFor( () => expect( navigation.navigate ).toHaveBeenCalledWith( "WidgetPrompt" ) );
  } );

  test( "위젯이 있으면 띄우지 않는다", async () => {
    mockedGetWidgetInfo.mockResolvedValue( [{ widgetId: 1 }] );
    const navigation = renderHome();
    await waitFor( () => expect( mockedGetWidgetInfo ).toHaveBeenCalled() );
    await act( async () => {} );
    expect( navigation.navigate ).not.toHaveBeenCalledWith( "WidgetPrompt" );
  } );

  test( "닫은 지 7일이 안 됐으면 띄우지 않는다", async () => {
    mockedGetWidgetInfo.mockResolvedValue( [] );
    await AsyncStorage.setItem( WIDGET_PROMPT_DISMISSED_AT_KEY, String( Date.now() - DAY ) );
    const navigation = renderHome();
    await waitFor( () => expect( mockedGetWidgetInfo ).toHaveBeenCalled() );
    await act( async () => {} );
    expect( navigation.navigate ).not.toHaveBeenCalledWith( "WidgetPrompt" );
  } );
} );
