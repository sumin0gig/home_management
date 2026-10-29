import React from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { GRID_COLUMNS, roomDisplayName } from "../../store/useRoomStore";
import type { HousePresetRoom } from "../../store/housePresets";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  rooms: Array<HousePresetRoom & { color?: string | null }>;
  // "white": 모든 방을 흰색(로그인 화면), "room": 방 색
  fill?: "white" | "room";
  showLabels?: boolean;
  // 아래에 겹쳐 그릴 것 (예: 마스코트)
  children?: React.ReactNode;
}

const CELL_GAP = 2;

// 누를 수 없는 평면도 그림. 로그인 화면, 집 모양 카드, 준비 완료 화면에서 쓴다.
function FloorPlanIllustration( {
  rooms,
  fill = "white",
  showLabels = true,
  children,
}: Props ): React.JSX.Element {
  const [width, setWidth] = React.useState( 0 );
  const cell = width / GRID_COLUMNS;
  const rows = Math.max( 1, ...rooms.map( r => r.y + r.height ) );

  const onLayout = (e: LayoutChangeEvent) => setWidth( e.nativeEvent.layout.width );

  return (
    <View
      style={ [styles.canvas, { height: rows * cell }] }
      onLayout={ onLayout }
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="floor-plan-illustration"
    >
      {
        width > 0
        ? rooms.map( (room, index) => (
            <View
              key={ index }
              style={ [
                styles.room,
                fill === "white" && styles.roomOutlined,
                {
                  left: room.x * cell + CELL_GAP / 2,
                  top: room.y * cell + CELL_GAP / 2,
                  width: room.width * cell - CELL_GAP,
                  height: room.height * cell - CELL_GAP,
                  backgroundColor:
                    fill === "room" ? room.color ?? colors.lightGray : colors.white,
                },
              ] }
            >
              {
                showLabels && room.width * cell >= 28
                ? <Text style={ styles.label } numberOfLines={ 1 }>
                    { roomDisplayName( room ) }
                  </Text>
                : null
              }
            </View>
          ) )
        : null
      }
      { children }
    </View>
  );
}

const styles = StyleSheet.create( {
  canvas: {
    width: "100%",
  },
  room: {
    position: "absolute",
    borderRadius: 8,
    padding: 5,
  },
  // 흰 방은 subtleBorder보다 조금 진한 테두리로 구분한다
  roomOutlined: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: commonColor.textSecondary,
  },
} );

export default FloorPlanIllustration;
