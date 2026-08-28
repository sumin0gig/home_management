import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ROOM_TYPE_LABELS,
  ROOM_SIZES,
  ROOM_SIZE_LABELS,
  ROOM_SIZE_WIDTH_RATIO,
  type RoomType,
  type RoomSize,
} from '../../../../api/room';
import { colors } from '../../../../styles/commonStyle';
import { getRoomColor } from '../../../../utils/commonUtils';

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

function RoomBlockTile({ block, onRemove, onPress, hasDueToday }: Props): React.JSX.Element {
  const sizeIndex = ROOM_SIZES.indexOf(block.size);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: getRoomColor(block.key), width: `${ROOM_SIZE_WIDTH_RATIO[block.size]}%` },
      ]}>
      {hasDueToday ? <View style={styles.dueBadge} testID={`due-badge-${block.key}`} /> : null}
      <View style={styles.tileHeader}>
        <Text style={styles.tileTitle}>{block.label.trim() || ROOM_TYPE_LABELS[block.roomType]}</Text>
        {onRemove ? (
          <Pressable onPress={onRemove}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: '25%',
    borderRadius: 10,
    padding: 10,
  },
  dueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.negative,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  removeText: {
    color: colors.negative,
    fontWeight: '600',
  },
  sizeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepperArrow: {
    color: colors.touchable,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  stepperArrowDisabled: {
    color: '#c3d4f7',
  },
  sizeLabel: {
    fontSize: 12,
    color: '#333',
  },
  labelInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    backgroundColor: '#fff',
  },
});

export default RoomBlockTile;
