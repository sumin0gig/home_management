import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { useRoomStore } from '../../../store/useRoomStore';
import { ROOM_TYPES, ROOM_TYPE_LABELS, type RoomType } from '../../../api/room';

interface SelectedRoom {
  key: string;
  roomType: NonNullable<RoomType>;
  label: string;
}

function FamilyOnboarding(): React.JSX.Element {
  const error = useFamilyStore(state => state.error);
  const createFamily = useFamilyStore(state => state.createFamily);
  const joinFamily = useFamilyStore(state => state.joinFamily);
  const addRoom = useRoomStore(state => state.addRoom);

  const [familyName, setFamilyName] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [selectedRooms, setSelectedRooms] = React.useState<SelectedRoom[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);

  const handleAddRoom = (roomType: NonNullable<RoomType>) => {
    setSelectedRooms(prev => [
      ...prev,
      { key: `${roomType}-${Date.now()}-${prev.length}`, roomType, label: '' },
    ]);
  };

  const handleRemoveRoom = (key: string) => {
    setSelectedRooms(prev => prev.filter(r => r.key !== key));
  };

  const handleRoomLabelChange = (key: string, label: string) => {
    setSelectedRooms(prev => prev.map(r => (r.key === key ? { ...r, label } : r)));
  };

  const handleCreate = async () => {
    if (!familyName.trim() || selectedRooms.length === 0) {
      return;
    }
    setIsCreating(true);
    try {
      const family = await createFamily(familyName.trim());
      for (const room of selectedRooms) {
        await addRoom(family.id, room.roomType, room.label.trim() || undefined);
      }
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      return;
    }
    setIsJoining(true);
    try {
      await joinFamily(inviteCode.trim());
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>가족 만들기</Text>
        <TextInput
          style={styles.input}
          placeholder="가족 이름"
          value={familyName}
          onChangeText={setFamilyName}
        />

        <Text style={styles.label}>방 추가하기</Text>
        <View style={styles.chipRow}>
          {ROOM_TYPES.map(roomType => (
            <Pressable
              key={roomType}
              style={styles.chip}
              onPress={() => handleAddRoom(roomType)}>
              <Text style={styles.chipText}>+ {ROOM_TYPE_LABELS[roomType]}</Text>
            </Pressable>
          ))}
        </View>

        {selectedRooms.length === 0 ? (
          <Text style={styles.emptyRooms}>최소 한 개의 방을 추가해주세요.</Text>
        ) : (
          selectedRooms.map(room => (
            <View key={room.key} style={styles.roomRow}>
              <Text style={styles.roomType}>{ROOM_TYPE_LABELS[room.roomType]}</Text>
              <TextInput
                style={styles.roomLabelInput}
                placeholder="이름(선택, 예: 안방)"
                value={room.label}
                onChangeText={text => handleRoomLabelChange(room.key, text)}
              />
              <Pressable onPress={() => handleRemoveRoom(room.key)}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          style={styles.button}
          onPress={handleCreate}
          disabled={isCreating || !familyName.trim() || selectedRooms.length === 0}>
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>만들기</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>초대 코드로 참여하기</Text>
        <TextInput
          style={styles.input}
          placeholder="초대 코드"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
        <Pressable style={styles.button} onPress={handleJoin} disabled={isJoining}>
          {isJoining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>참여하기</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    color: '#2f6fed',
    fontWeight: '600',
  },
  emptyRooms: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomType: {
    width: 48,
    fontSize: 14,
    fontWeight: '600',
  },
  roomLabelInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    marginRight: 8,
  },
  removeText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FamilyOnboarding;
