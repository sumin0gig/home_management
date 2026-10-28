import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MascotFace from "../Mascot/MascotFace";
import type { MascotConfig } from "../Mascot/types";
import {
  DEFAULT_WIDGET_SIZE,
  layoutWidgetGrid,
  type WidgetTask,
} from "../../widget/widgetSnapshot";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  tasks: WidgetTask[];
  mascotConfig: MascotConfig | null;
}

// 홈 화면 위젯(TaskWidget)과 같은 모양을 앱 안에서 일반 RN 컴포넌트로 그린다.
// 위젯 설치 안내에서 "이렇게 보여요"를 보여주는 용도.
function WidgetPreviewCard( { tasks, mascotConfig }: Props ): React.JSX.Element {
  const { columns, shown, overflow } = layoutWidgetGrid(
    tasks,
    DEFAULT_WIDGET_SIZE,
  );
  const cells: Array<WidgetTask | { more: number }> = [
    ...shown,
    ...( overflow > 0 ? [{ more: overflow }] : [] ),
  ];
  const rows: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push( cells.slice( i, i + columns ) );
  }

  return (
    <View
      style={ styles.widget }
      testID="widget-preview"
      accessible
      accessibilityLabel={ `위젯 미리보기, 오늘 할 일 ${tasks.length}개` }
    >
      <View style={ styles.header }>
        {
          mascotConfig
          ? <MascotFace config={ mascotConfig } size={ 24 } />
          : null
        }
        <Text style={ styles.headerTitle }> 오늘 할 일 </Text>
        <View style={ styles.countPill }>
          <Text style={ styles.countText }> { tasks.length } </Text>
        </View>
      </View>
      { rows.map( (row, rowIndex) => (
        <View style={ styles.row } key={ rowIndex }>
          { row.map( cell =>
            "more" in cell
              ? <View style={ [styles.cell, styles.moreCell] } key="more">
                  <Text style={ styles.moreText }> { `+${cell.more}개` } </Text>
                </View>
              : <View style={ styles.cell } key={ cell.id }>
                  <View
                    style={ [
                      styles.swatch,
                      { backgroundColor: cell.roomColor ?? colors.lightGray },
                    ] }
                  />
                  <Text style={ styles.cellText } numberOfLines={ 1 }>
                    { cell.title }
                  </Text>
                </View>,
          ) }
          {
            row.length < columns
            ? <View style={ styles.spacer } />
            : null
          }
        </View>
      ) ) }
    </View>
  );
}

const styles = StyleSheet.create( {
  widget: {
    width: "100%",
    maxWidth: 340,
    padding: 12,
    borderRadius: 22,
    backgroundColor: colors.default,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    marginBottom: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: commonColor.touchable,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  cell: {
    flex: 1,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  cellText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  moreCell: {
    justifyContent: "center",
    borderStyle: "dashed",
    borderColor: commonColor.textSecondary,
    backgroundColor: "transparent",
  },
  moreText: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textMuted,
  },
  spacer: {
    flex: 1,
  },
} );

export default WidgetPreviewCard;
