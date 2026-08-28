import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useChoreStore } from '../../store/useChoreStore';
import { useRoomStore } from '../../store/useRoomStore';
import {
  listChoreLogs,
  toDateString,
  type ChoreInput,
  type ChoreLogRow,
  type IntervalUnit,
} from '../../api/chore';
import { roomDisplayName } from '../../api/room';
import { colors } from '../../styles/commonStyle';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChoreForm'>;

const INTERVAL_UNIT_LABELS: Record<'DAY' | 'WEEK' | 'MONTH', string> = {
  DAY: '일',
  WEEK: '주',
  MONTH: '개월',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function ChoreFormScreen({ navigation, route }: Props): React.JSX.Element {
  const choreId = route.params?.choreId;
  const isEditMode = Boolean(choreId);

  const chores = useChoreStore(state => state.chores);
  const createChore = useChoreStore(state => state.createChore);
  const updateChore = useChoreStore(state => state.updateChore);
  const deleteChore = useChoreStore(state => state.deleteChore);
  const rooms = useRoomStore(state => state.rooms);

  const existingChore = React.useMemo(
    () => chores.find(c => c.id === choreId),
    [chores, choreId],
  );

  const [roomId, setRoomId] = React.useState<string | null>(existingChore?.roomId ?? null);
  const [title, setTitle] = React.useState(existingChore?.title ?? '');
  const [description, setDescription] = React.useState(existingChore?.description ?? '');
  const [recurrenceType, setRecurrenceType] = React.useState<'INTERVAL' | 'YEARLY_MONTHS'>(
    existingChore?.recurrenceType ?? 'INTERVAL',
  );
  const [intervalValue, setIntervalValue] = React.useState(
    String(existingChore?.intervalValue ?? 1),
  );
  const [intervalUnit, setIntervalUnit] = React.useState<'DAY' | 'WEEK' | 'MONTH'>(
    (existingChore?.intervalUnit as IntervalUnit) ?? 'WEEK',
  );
  const [months, setMonths] = React.useState<number[]>(
    existingChore?.months?.filter((m): m is number => m !== null) ?? [],
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<ChoreLogRow[]>([]);

  React.useEffect(() => {
    navigation.setOptions({ title: isEditMode ? '집안일 수정' : '집안일 추가' });
  }, [navigation, isEditMode]);

  React.useEffect(() => {
    if (choreId) {
      listChoreLogs(choreId)
        .then(setLogs)
        .catch(err => setError((err as Error).message));
    }
  }, [choreId]);

  const toggleMonth = (month: number) => {
    setMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month].sort((a, b) => a - b),
    );
  };

  const handleSave = async () => {
    if (!roomId) {
      setError('방을 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (recurrenceType === 'YEARLY_MONTHS' && months.length === 0) {
      setError('최소 한 달을 선택해주세요.');
      return;
    }
    const parsedIntervalValue = Number(intervalValue);
    if (
      recurrenceType === 'INTERVAL' &&
      (!Number.isInteger(parsedIntervalValue) || parsedIntervalValue < 1)
    ) {
      setError('간격은 1 이상의 정수로 입력해주세요.');
      return;
    }
    const input: ChoreInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      recurrenceType,
      intervalValue: recurrenceType === 'INTERVAL' ? parsedIntervalValue : undefined,
      intervalUnit: recurrenceType === 'INTERVAL' ? intervalUnit : undefined,
      months: recurrenceType === 'YEARLY_MONTHS' ? months : undefined,
    };

    setIsSaving(true);
    setError(null);
    try {
      if (isEditMode && choreId) {
        await updateChore(choreId, input, roomId);
      } else {
        await createChore(roomId, input);
      }
      navigation.goBack();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!choreId) {
      return;
    }
    Alert.alert(
      '집안일 삭제',
      `'${title}' 항목을 삭제할까요? 이 집안일의 완료 기록도 모두 함께 삭제되며, 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChore(choreId);
              navigation.goBack();
            } catch (err) {
              setError((err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>방</Text>
      <View style={styles.chipRow}>
        {rooms.map(room => (
          <Pressable
            key={room.id}
            style={[styles.chip, roomId === room.id && styles.chipSelected]}
            onPress={() => setRoomId(room.id)}>
            <Text style={roomId === room.id ? styles.chipTextSelected : styles.chipText}>
              {roomDisplayName(room)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>제목</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>설명</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>반복 방식</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, recurrenceType === 'INTERVAL' && styles.chipSelected]}
          onPress={() => setRecurrenceType('INTERVAL')}>
          <Text style={recurrenceType === 'INTERVAL' ? styles.chipTextSelected : styles.chipText}>
            간격 반복
          </Text>
        </Pressable>
        <Pressable
          style={[styles.chip, recurrenceType === 'YEARLY_MONTHS' && styles.chipSelected]}
          onPress={() => setRecurrenceType('YEARLY_MONTHS')}>
          <Text
            style={recurrenceType === 'YEARLY_MONTHS' ? styles.chipTextSelected : styles.chipText}>
            특정 달 반복
          </Text>
        </Pressable>
      </View>

      {recurrenceType === 'INTERVAL' ? (
        <View>
          <Text style={styles.label}>간격</Text>
          <TextInput
            style={styles.input}
            value={intervalValue}
            onChangeText={setIntervalValue}
            keyboardType="number-pad"
          />
          <View style={styles.chipRow}>
            {(Object.keys(INTERVAL_UNIT_LABELS) as Array<'DAY' | 'WEEK' | 'MONTH'>).map(unit => (
              <Pressable
                key={unit}
                style={[styles.chip, intervalUnit === unit && styles.chipSelected]}
                onPress={() => setIntervalUnit(unit)}>
                <Text style={intervalUnit === unit ? styles.chipTextSelected : styles.chipText}>
                  {INTERVAL_UNIT_LABELS[unit]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.label}>해당 달 선택</Text>
          <View style={styles.chipRow}>
            {MONTHS.map(month => (
              <Pressable
                key={month}
                style={[styles.monthChip, months.includes(month) && styles.chipSelected]}
                onPress={() => toggleMonth(month)}>
                <Text style={months.includes(month) ? styles.chipTextSelected : styles.chipText}>
                  {month}월
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>저장</Text>
        )}
      </Pressable>

      {isEditMode ? (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>삭제</Text>
        </Pressable>
      ) : null}

      {isEditMode ? (
        <View style={styles.logsSection}>
          <Text style={styles.label}>최근 완료 기록</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogs}>완료 기록이 없습니다.</Text>
          ) : (
            logs.map(log => (
              <Text key={log.id} style={styles.logItem}>
                {toDateString(new Date(log.completedAt))} · {log.completedByName}
              </Text>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.default,
  },
  container: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 52,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.touchable,
    borderColor: colors.touchable,
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  deleteButtonText: {
    color: colors.negative,
    fontSize: 16,
    fontWeight: '600',
  },
  logsSection: {
    marginTop: 28,
  },
  emptyLogs: {
    fontSize: 14,
    color: '#999',
  },
  logItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
  },
});

export default ChoreFormScreen;
