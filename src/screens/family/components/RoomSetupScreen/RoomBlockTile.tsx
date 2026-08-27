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
import { commonStyle } from '../../../../styles/commonStyle';

export interface RoomBlock {
  key: string;
  roomType: NonNullable<RoomType>;
  size: NonNullable<RoomSize>;
  label: string;
}

interface Props {
  block: RoomBlock;
  onRemove: () => void;
  onResize: (direction: -1 | 1) => void;
  onLabelChange: (label: string) => void;
}

function RoomBlockTile({ block, onRemove, onResize, onLabelChange }: Props): React.JSX.Element {
  const sizeIndex = ROOM_SIZES.indexOf(block.size);

  return (
    <View style={[styles.tile, { width: `${ROOM_SIZE_WIDTH_RATIO[block.size]}%` }]}>
      <View style={styles.tileHeader}>
        <Text style={styles.tileTitle}>{block.label.trim() || ROOM_TYPE_LABELS[block.roomType]}</Text>
        <Pressable onPress={onRemove}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.sizeStepper}>
        <Pressable onPress={() => onResize(-1)} disabled={sizeIndex === 0} hitSlop={8}>
          <Text style={[styles.stepperArrow, sizeIndex === 0 && styles.stepperArrowDisabled]}>
            ◀
          </Text>
        </Pressable>
        <Text style={styles.sizeLabel}>{ROOM_SIZE_LABELS[block.size]}</Text>
        <Pressable
          onPress={() => onResize(1)}
          disabled={sizeIndex === ROOM_SIZES.length - 1}
          hitSlop={8}>
          <Text
            style={[
              styles.stepperArrow,
              sizeIndex === ROOM_SIZES.length - 1 && styles.stepperArrowDisabled,
            ]}>
            ▶
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.labelInput}
        placeholder="이름(선택, 예: 안방)"
        value={block.label}
        onChangeText={onLabelChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: '25%',
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 10,
    backgroundColor: '#eaf1ff',
    padding: 10,
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
    color: commonStyle.negativeColor,
    fontWeight: '600',
  },
  sizeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepperArrow: {
    color: commonStyle.touchableColor,
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
