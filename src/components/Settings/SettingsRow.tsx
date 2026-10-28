import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";
import Icon from "../common/Icon";

interface Props {
  label: string;
  // 오른쪽 값 (13, 보조색)
  value?: string;
  // 없으면 누를 수 없는 줄 (› 없음)
  onPress?: () => void;
  // 스위치 등 오른쪽에 직접 넣을 것
  accessory?: React.ReactNode;
  testID?: string;
}

// 설정의 한 줄: 높이 48 이상, 왼쪽 글자 14 굵게, 오른쪽 값, 맨 오른쪽 ›
function SettingsRow( {
  label,
  value,
  onPress,
  accessory,
  testID,
}: Props ): React.JSX.Element {
  const content = (
    <>
      <Text style={ styles.label } numberOfLines={ 1 }> { label } </Text>
      <View style={ styles.right }>
        {
          value
          ? <Text style={ styles.value } numberOfLines={ 1 }> { value } </Text>
          : null
        }
        { accessory }
        {
          onPress
          ? <Icon name="ChevronRight" size={ 14 } color={ commonColor.textSecondary } />
          : null
        }
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={ styles.row }
        testID={ testID }
        accessible={ !accessory }
        accessibilityLabel={ value ? `${label}, ${value}` : label }
      >
        { content }
      </View>
    );
  }
  return (
    <Pressable
      style={ ({ pressed }) => [styles.row, pressed && styles.rowPressed] }
      onPress={ onPress }
      accessibilityRole="button"
      accessibilityLabel={ value ? `${label}, ${value}` : label }
      testID={ testID }
    >
      { content }
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowPressed: {
    backgroundColor: colors.lightGray,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
} );

export default SettingsRow;
