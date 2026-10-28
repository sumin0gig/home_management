import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";
import BottomSheetModal from "./BottomSheetModal";

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  // 목록 등 추가 내용
  children?: React.ReactNode;
  confirmText: string;
  // danger면 확인 버튼이 commonColor.error
  confirmTone?: "default" | "danger";
  cancelText?: string;
  // 알림처럼 확인 버튼 하나만 둘 때
  hideCancel?: boolean;
  confirmDisabled?: boolean;
  // 버튼에 스피너, 두 번 눌리지 않고 닫히지도 않는다
  isConfirming?: boolean;
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
}

// 아래에서 올라오는 확인 시트. 09·11·12에서도 같이 쓴다.
function ConfirmSheet( {
  visible,
  title,
  description,
  children,
  confirmText,
  confirmTone = "default",
  cancelText = "취소",
  hideCancel = false,
  confirmDisabled = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: Props ): React.JSX.Element | null {
  const isDanger = confirmTone === "danger";
  return (
    <BottomSheetModal
      visible={ visible }
      onRequestClose={ onCancel }
      canClose={ !isConfirming }
      testID="confirm-sheet"
    >
      <Text style={ styles.title } accessibilityRole="header">
        { title }
      </Text>
      {
        description
        ? <Text style={ styles.description }> { description } </Text>
        : null
      }
      { children }
      <View style={ styles.buttons }>
        {
          hideCancel
          ? null
          : <Pressable
              style={ [styles.button, styles.cancelButton] }
              onPress={ onCancel }
              disabled={ isConfirming }
              accessibilityRole="button"
            >
              <Text style={ styles.cancelText }> { cancelText } </Text>
            </Pressable>
        }
        <Pressable
          style={ [
            styles.button,
            { backgroundColor: isDanger ? commonColor.error : commonColor.touchable },
            (confirmDisabled || isConfirming) && styles.buttonDisabled,
          ] }
          onPress={ () => {
            if (!isConfirming && !confirmDisabled) {
              onConfirm();
            }
          } }
          disabled={ confirmDisabled || isConfirming }
          accessibilityRole="button"
          accessibilityLabel={ confirmText }
          accessibilityState={ {
            disabled: confirmDisabled || isConfirming,
            busy: isConfirming,
          } }
          testID="confirm-sheet-confirm"
        >
          {
            isConfirming
            ? <ActivityIndicator color={ colors.white } />
            : <Text style={ styles.confirmText }> { confirmText } </Text>
          }
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create( {
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: commonColor.textMuted,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
} );

export default ConfirmSheet;
