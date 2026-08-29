import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ROOM_TYPE_LABELS,
  ROOM_SIZE_WIDTH_RATIO,
  type RoomType,
  type RoomSize,
} from "../../api/room";
import { commonColor } from "../../styles/commonStyle";
import { getRoomColor } from "../../utils/commonUtils";

export interface RoomBlock {
  key: string;
  roomType: NonNullable<RoomType>;
  size: NonNullable<RoomSize>;
  label: string;
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
          width: `${ROOM_SIZE_WIDTH_RATIO[block.size]}%`,
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
