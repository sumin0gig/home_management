import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ModalView from '../../../../components/common/ModalView';
import {
  ROOM_SIZES,
  ROOM_SIZE_LABELS,
  DEFAULT_ROOM_SIZE,
  type RoomSize,
} from '../../../../api/room';
import { colors } from '../../../../styles/commonStyle';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, size: NonNullable<RoomSize>) => void;
}

function CustomRoomModal({ visible, onClose, onSubmit }: Props): React.JSX.Element {
  const [name, setName] = React.useState('');
  const [size, setSize] = React.useState<NonNullable<RoomSize>>(DEFAULT_ROOM_SIZE);

  const resetForm = () => {
    setName('');
    setSize(DEFAULT_ROOM_SIZE);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit(name.trim(), size);
    resetForm();
  };

  return (
    <ModalView visible={visible} onRequestClose={handleClose}>
      <Text style={styles.modalTitle}>다른 방 만들기</Text>
      <TextInput
        style={styles.input}
        placeholder="방 이름(예: 서재)"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <View style={styles.chipRow}>
        {ROOM_SIZES.map(sizeOption => (
          <Pressable
            key={sizeOption}
            style={[styles.sizeChip, size === sizeOption && styles.sizeChipSelected]}
            onPress={() => setSize(sizeOption)}>
            <Text style={size === sizeOption ? styles.sizeChipTextSelected : styles.sizeChipText}>
              {ROOM_SIZE_LABELS[sizeOption]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.modalButtonRow}>
        <Pressable style={styles.modalCancelButton} onPress={handleClose}>
          <Text style={styles.modalCancelButtonText}>취소</Text>
        </Pressable>
        <Pressable style={styles.modalAddButton} onPress={handleSubmit} disabled={!name.trim()}>
          <Text style={styles.modalAddButtonText}>추가</Text>
        </Pressable>
      </View>
    </ModalView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.touchable,
    borderColor: colors.touchable,
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
    backgroundColor: colors.touchable,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CustomRoomModal;
