import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  title?: string;
  // 묶음 아래 작은 설명
  footnote?: string;
  children: React.ReactNode;
  testID?: string;
}

// 설정의 한 묶음: 제목(12, 굵게, 보조색) + 흰 바탕 카드(줄 사이 구분선)
function SettingsGroup( { title, footnote, children, testID }: Props ): React.JSX.Element {
  const rows = React.Children.toArray( children ).filter( Boolean );
  return (
    <View style={ styles.group } testID={ testID }>
      {
        title
        ? <Text style={ styles.title } accessibilityRole="header"> { title } </Text>
        : null
      }
      <View style={ styles.card }>
        { rows.map( (row, index) => (
          <View key={ index } style={ index > 0 && styles.divider }>
            { row }
          </View>
        ) ) }
      </View>
      {
        footnote
        ? <Text style={ styles.footnote }> { footnote } </Text>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  group: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  card: {
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.12)",
  },
  footnote: {
    fontSize: 12,
    color: commonColor.textSecondary,
    paddingHorizontal: 16,
    marginTop: 6,
  },
} );

export default SettingsGroup;
