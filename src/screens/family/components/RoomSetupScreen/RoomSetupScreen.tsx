import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../../../store/useFamilyStore';
import { useRoomStore } from '../../../../store/useRoomStore';
import { signOutUser } from '../../../../api/auth';
import {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  ROOM_SIZES,
  ROOM_TYPE_DEFAULT_SIZE,
  type RoomType,
  type RoomSize,
} from '../../../../api/room';
import RoomBlockTile, { type RoomBlock } from './RoomBlockTile';
import CustomRoomModal from './CustomRoomModal';
import { commonStyle } from '../../../../styles/commonStyle';

function RoomSetupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore(state => state.family);
  const error = useRoomStore(state => state.error);
  const addRoom = useRoomStore(state => state.addRoom);

  const [blocks, setBlocks] = React.useState<RoomBlock[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isCustomModalVisible, setIsCustomModalVisible] = React.useState(false);

  const handleAddBlock = (roomType: NonNullable<RoomType>) => {
    setBlocks(prev => [
      ...prev,
      {
        key: `${roomType}-${Date.now()}-${prev.length}`,
        roomType,
        size: ROOM_TYPE_DEFAULT_SIZE[roomType],
        label: '',
      },
    ]);
  };

  const handleAddCustomBlock = (name: string, size: NonNullable<RoomSize>) => {
    setBlocks(prev => [
      ...prev,
      { key: `GENERAL_ROOM-${Date.now()}-${prev.length}`, roomType: 'GENERAL_ROOM', size, label: name },
    ]);
    setIsCustomModalVisible(false);
  };

  const handleRemoveBlock = (key: string) => {
    setBlocks(prev => prev.filter(b => b.key !== key));
  };

  const handleResizeBlock = (key: string, direction: -1 | 1) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.key !== key) {
          return b;
        }
        const currentIndex = ROOM_SIZES.indexOf(b.size);
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ROOM_SIZES.length - 1);
        return { ...b, size: ROOM_SIZES[nextIndex] };
      }),
    );
  };

  const handleLabelChange = (key: string, label: string) => {
    setBlocks(prev => prev.map(b => (b.key === key ? { ...b, label } : b)));
  };

  const handleSubmit = async () => {
    if (!family || blocks.length === 0) {
      return;
    }
    setIsSaving(true);
    setSubmitError(null);
    try {
      await Promise.all(
        blocks.map(block =>
          addRoom(family.id, block.roomType, block.size, block.label.trim() || undefined),
        ),
      );
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.logoutLink, { top: insets.top + 16 }]}
        onPress={() => signOutUser()}>
        <Text style={styles.logoutLinkText}>로그아웃</Text>
      </Pressable>

      <Text style={styles.title}>우리 집은 어떻게 생겼나요?</Text>
      <Text style={styles.description}>
        방을 추가해서 우리 집 도면을 만들어보세요. 나중에 언제든 바꿀 수 있어요.
      </Text>

      {(error || submitError) ? <Text style={styles.error}>{submitError ?? error}</Text> : null}

      <View style={styles.paletteRow}>
        {ROOM_TYPES.map(roomType => (
          <Pressable key={roomType} style={styles.paletteChip} onPress={() => handleAddBlock(roomType)}>
            <Text style={styles.paletteChipText}>+ {ROOM_TYPE_LABELS[roomType]}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.customChip} onPress={() => setIsCustomModalVisible(true)}>
          <Text style={styles.customChipText}>+ 다른 방 만들기</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.floorPlanScroll} contentContainerStyle={styles.floorPlan}>
        {blocks.length === 0 ? (
          <Text style={styles.emptyText}>위에서 방을 탭해 추가해보세요.</Text>
        ) : (
          blocks.map(block => (
            <RoomBlockTile
              key={block.key}
              block={block}
              onRemove={() => handleRemoveBlock(block.key)}
            />
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSaving || blocks.length === 0}>
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>집 만들기</Text>
        )}
      </Pressable>

      <CustomRoomModal
        visible={isCustomModalVisible}
        onClose={() => setIsCustomModalVisible(false)}
        onSubmit={handleAddCustomBlock}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonStyle.defaultBackgroundColor,
  },
  logoutLink: {
    position: 'absolute',
    right: 16,
  },
  logoutLinkText: {
    color: '#555',
    fontSize: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paletteChip: {
    borderWidth: 1,
    borderColor: commonStyle.touchableColor,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  paletteChipText: {
    color: commonStyle.touchableColor,
    fontWeight: '600',
  },
  customChip: {
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  customChipText: {
    color: '#555',
    fontWeight: '600',
  },
  floorPlanScroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  floorPlan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    padding: 16,
  },
  submitButton: {
    backgroundColor: commonStyle.touchableColor,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoomSetupScreen;
