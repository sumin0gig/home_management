import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WidgetConfigScreen } from "../../src/widget/WidgetConfigScreen";
import {
  WIDGET_SHOW_MASCOT_STORAGE_KEY,
  WIDGET_SNAPSHOT_STORAGE_KEY,
} from "../../src/widget/widgetSnapshot";

const widgetInfo = { widgetName: "TaskWidget", widgetId: 1, width: 320, height: 180 } as never;

describe( "WidgetConfigScreen", () => {
  beforeEach( async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      WIDGET_SNAPSHOT_STORAGE_KEY,
      JSON.stringify( {
        tasks: [{ id: "a", title: "설거지", roomColor: null, nextDueDate: "2000-01-01" }],
        mascot: { fillColor: null, earStyle: "ROUND" },
        showMascot: true,
      } ),
    );
  } );

  test( "스위치를 끄면 저장하고, 할 일은 그대로 둔 채 마스코트 없이 다시 그린다", async () => {
    const renderWidget = jest.fn();
    const setResult = jest.fn();
    const { getByLabelText, getByText } = render(
      <WidgetConfigScreen widgetInfo={ widgetInfo } renderWidget={ renderWidget } setResult={ setResult } />,
    );
    await waitFor( () => expect( getByLabelText( "위젯에 마스코트 보이기" ).props.value ).toBe( true ) );

    await act( async () => {
      fireEvent( getByLabelText( "위젯에 마스코트 보이기" ), "valueChange", false );
    } );

    await waitFor( () => expect( renderWidget ).toHaveBeenCalled() );
    expect( await AsyncStorage.getItem( WIDGET_SHOW_MASCOT_STORAGE_KEY ) ).toBe( "false" );
    const stored = JSON.parse( ( await AsyncStorage.getItem( WIDGET_SNAPSHOT_STORAGE_KEY ) )! );
    expect( stored.showMascot ).toBe( false );
    expect( stored.tasks ).toHaveLength( 1 );

    fireEvent.press( getByText( "완료" ) );
    expect( setResult ).toHaveBeenCalledWith( "ok" );
  } );
} );
