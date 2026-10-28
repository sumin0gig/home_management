import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import ConfirmSheet from "../../../src/components/common/ConfirmSheet";
import { commonColor } from "../../../src/styles/commonStyle";

function renderSheet( props: Partial<React.ComponentProps<typeof ConfirmSheet>> = {} ) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const utils = render(
    <ConfirmSheet
      visible
      title="부엌을 삭제할까요?"
      description="집안일 3개와 완료 기록이 함께 삭제돼요."
      confirmText="삭제"
      onConfirm={ onConfirm }
      onCancel={ onCancel }
      { ...props }
    />,
  );
  return { ...utils, onConfirm, onCancel };
}

describe( "ConfirmSheet", () => {
  test( "제목·설명·두 버튼을 그리고, 확인과 취소를 부른다", () => {
    const { getByText, onConfirm, onCancel } = renderSheet();
    expect( getByText( "부엌을 삭제할까요?" ) ).toBeTruthy();
    expect( getByText( "집안일 3개와 완료 기록이 함께 삭제돼요." ) ).toBeTruthy();

    fireEvent.press( getByText( "삭제" ) );
    fireEvent.press( getByText( "취소" ) );
    expect( onConfirm ).toHaveBeenCalledTimes( 1 );
    expect( onCancel ).toHaveBeenCalledTimes( 1 );
  } );

  test( "danger면 확인 버튼이 error 색", () => {
    const { getByTestId } = renderSheet( { confirmTone: "danger" } );
    const style = StyleSheet.flatten( getByTestId( "confirm-sheet-confirm" ).props.style );
    expect( style.backgroundColor ).toBe( commonColor.error );
  } );

  test( "isConfirming이면 확인을 눌러도 onConfirm이 다시 불리지 않고, 막을 눌러도 닫히지 않는다", () => {
    const { getByTestId, onConfirm, onCancel } = renderSheet( { isConfirming: true } );
    fireEvent.press( getByTestId( "confirm-sheet-confirm" ) );
    fireEvent.press( getByTestId( "confirm-sheet-overlay" ) );
    expect( onConfirm ).not.toHaveBeenCalled();
    expect( onCancel ).not.toHaveBeenCalled();
  } );

  test( "막을 누르면 onCancel", () => {
    const { getByTestId, onCancel } = renderSheet();
    fireEvent.press( getByTestId( "confirm-sheet-overlay" ) );
    expect( onCancel ).toHaveBeenCalled();
  } );

  test( "visible이 false면 아무것도 그리지 않는다", () => {
    const { toJSON } = renderSheet( { visible: false } );
    expect( toJSON() ).toBeNull();
  } );
} );
