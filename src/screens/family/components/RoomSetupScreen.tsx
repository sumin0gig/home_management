import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { useRoomStore } from '../../../store/useRoomStore';
import { signOutUser } from '../../../api/auth';
import {
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
  ROOM_SIZES,
  ROOM_SIZE_LABELS,
  ROOM_SIZE_WIDTH_RATIO,
  DEFAULT_ROOM_SIZE,
  type RoomType,
  type RoomSize,
} from '../../../api/room';

interface RoomBlock {
  key: string;
  roomType: NonNullable<RoomType>;
  size: NonNullable<RoomSize>;
  label: string;
}

function RoomSetupScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore(state => state.family);
  const error = useRoomStore(state => state.error);
  const addRoom = useRoomStore(state => state.addRoom);

  const [blocks, setBlocks] = React.useState<RoomBlock[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [isCustomModalVisible, setIsCustomModalVisible] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customSize, setCustomSize] = React.useState<NonNullable<RoomSize>>(DEFAULT_ROOM_SIZE);

  const handleAddBlock = (roomType: NonNullable<RoomType>) => {
    setBlocks(prev => [
      ...prev,
      { key: `${roomType}-${Date.now()}-${prev.length}`, roomType, size: DEFAULT_ROOM_SIZE, label: '' },
    ]);
  };

  const handleOpenCustomModal = () => {
    setCustomName('');
    setCustomSize(DEFAULT_ROOM_SIZE);
    setIsCustomModalVisible(true);
  };

  const handleAddCustomBlock = () => {
    if (!customName.trim()) {
      return;
    }
    setBlocks(prev => [
      ...prev,
      {
        key: `GENERAL_ROOM-${Date.now()}-${prev.length}`,
        roomType: 'GENERAL_ROOM',
        size: customSize,
        label: customName.trim(),
      },
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
        <Pressable style={styles.customChip} onPress={handleOpenCustomModal}>
          <Text style={styles.customChipText}>+ 다른 방 만들기</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.floorPlanScroll} contentContainerStyle={styles.floorPlan}>
        {blocks.length === 0 ? (
          <Text style={styles.emptyText}>위에서 방을 탭해 추가해보세요.</Text>
        ) : (
          blocks.map(block => (
            <View
              key={block.key}
              style={[styles.tile, { width: `${ROOM_SIZE_WIDTH_RATIO[block.size]}%` }]}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileTitle}>
                  {block.label.trim() || ROOM_TYPE_LABELS[block.roomType]}
                </Text>
                <Pressable onPress={() => handleRemoveBlock(block.key)}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.sizeStepper}>
                <Pressable
                  onPress={() => handleResizeBlock(block.key, -1)}
                  disabled={ROOM_SIZES.indexOf(block.size) === 0}
                  hitSlop={8}>
                  <Text
                    style={[
                      styles.stepperArrow,
                      ROOM_SIZES.indexOf(block.size) === 0 && styles.stepperArrowDisabled,
                    ]}>
                    ◀
                  </Text>
                </Pressable>
                <Text style={styles.sizeLabel}>{ROOM_SIZE_LABELS[block.size]}</Text>
                <Pressable
                  onPress={() => handleResizeBlock(block.key, 1)}
                  disabled={ROOM_SIZES.indexOf(block.size) === ROOM_SIZES.length - 1}
                  hitSlop={8}>
                  <Text
                    style={[
                      styles.stepperArrow,
                      ROOM_SIZES.indexOf(block.size) === ROOM_SIZES.length - 1 &&
                        styles.stepperArrowDisabled,
                    ]}>
                    ▶
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.labelInput}
                placeholder="이름(선택, 예: 안방)"
                value={block.label}
                onChangeText={text => handleLabelChange(block.key, text)}
              />
            </View>
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

      <Modal
        visible={isCustomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>다른 방 만들기</Text>
            <TextInput
              style={styles.input}
              placeholder="방 이름(예: 서재)"
              value={customName}
              onChangeText={setCustomName}
              autoFocus
            />
            <View style={styles.chipRow}>
              {ROOM_SIZES.map(size => (
                <Pressable
                  key={size}
                  style={[styles.sizeChip, customSize === size && styles.sizeChipSelected]}
                  onPress={() => setCustomSize(size)}>
                  <Text
                    style={customSize === size ? styles.sizeChipTextSelected : styles.sizeChipText}>
                    {ROOM_SIZE_LABELS[size]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setIsCustomModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.modalAddButton}
                onPress={handleAddCustomBlock}
                disabled={!customName.trim()}>
                <Text style={styles.modalAddButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
    borderColor: '#2f6fed',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  paletteChipText: {
    color: '#2f6fed',
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
    color: '#d32f2f',
    fontWeight: '600',
  },
  sizeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepperArrow: {
    color: '#2f6fed',
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
  submitButton: {
    backgroundColor: '#2f6fed',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  sizeChipSelected: {
    backgroundColor: '#2f6fed',
    borderColor: '#2f6fed',
  },
  sizeChipText: {
    color: '#333',
  },
  sizeChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalCancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#2f6fed',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default RoomSetupScreen;
