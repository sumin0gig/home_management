import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";
import BottomSheetModal from "./BottomSheetModal";

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
}

interface Props {
  visible: boolean;
  title?: string;
  actions: ActionSheetAction[];
  onCancel: () => void;
}

// ConfirmSheet와 같은 시트 모양에 줄 버튼만 있는 선택 시트
function ActionSheet( { visible, title, actions, onCancel }: Props ): React.JSX.Element | null {
  return (
    <BottomSheetModal visible={ visible } onRequestClose={ onCancel } testID="action-sheet">
      {
        title
        ? <Text style={ styles.title } accessibilityRole="header"> { title } </Text>
        : null
      }
      { actions.map( action => (
        <Pressable
          key={ action.label }
          style={ ({ pressed }) => [styles.row, pressed && styles.rowPressed] }
          onPress={ action.onPress }
          accessibilityRole="button"
        >
          <Text
            style={ [styles.rowText, action.tone === "danger" && styles.rowTextDanger] }
          >
            { action.label }
          </Text>
        </Pressable>
      ) ) }
      <Pressable style={ styles.cancel } onPress={ onCancel } accessibilityRole="button">
        <Text style={ styles.cancelText }> 취소 </Text>
      </Pressable>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create( {
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: commonColor.textMuted,
    marginBottom: 8,
  },
  row: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  rowPressed: {
    backgroundColor: colors.lightGray,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  rowTextDanger: {
    color: commonColor.error,
  },
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    color: commonColor.textMuted,
  },
} );

export default ActionSheet;
