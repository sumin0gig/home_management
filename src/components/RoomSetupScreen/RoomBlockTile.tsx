import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ROOM_TYPE_LABELS, type RoomType } from "../../store/useRoomStore";
import { commonColor } from "../../styles/commonStyle";
import { getRoomColor } from "../../utils/commonUtils";

// 평면도 편집 UI가 나오기 전까지, 그리드 칸 수(width)를 타일 너비 비율(%)로
// 환산하는 임시 계수.
const CELL_WIDTH_PERCENT = 20;

export interface RoomBlock {
  key: string;
  roomType: NonNullable<RoomType>;
  label: string;
  width: number;
  height: number;
}

interface Props {
  block: RoomBlock;
  onRemove?: () => void;
  onPress?: () => void;
  hasDueToday?: boolean;
}

function RoomBlockTile( {
  block,
  onRemove,
  onPress,
  hasDueToday,
}: Props ): React.JSX.Element {
  return (
    <Pressable
      onPress={ onPress }
      style={ [
        styles.tile,
        {
          backgroundColor: getRoomColor( block.key ),
          width: `${Math.min( block.width * CELL_WIDTH_PERCENT, 100 )}%`,
        },
      ] }
    >
      {
        hasDueToday
        ? <View style={ styles.dueBadge } testID={ `due-badge-${block.key}` } />
        : null
      }
      <View style={ styles.tileHeader }>
        <Text style={ styles.tileTitle }>
          { block.label.trim() || ROOM_TYPE_LABELS[block.roomType] }
        </Text>
        {
          onRemove
          ? <Pressable onPress={ onRemove }>
            <Text style={ styles.removeText }> ✕ </Text>
          </Pressable>
          : null
        }
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  tile: {
    minWidth: "25%",
    borderRadius: 10,
    padding: 10,
  },
  dueBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: commonColor.negative,
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  removeText: {
    color: commonColor.negative,
    fontWeight: "600",
  },
} );

export default RoomBlockTile;
