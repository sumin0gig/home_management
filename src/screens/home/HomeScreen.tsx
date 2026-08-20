import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { useChoreStore } from '../../store/useChoreStore';
import { toDateString, type ChoreRow } from '../../api/chore';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

function formatDueLabel(nextDueDate: string, today: string): string {
  if (nextDueDate < today) {
    return '기한 지남';
  }
  if (nextDueDate === today) {
    return '오늘';
  }
  return `예정 (${nextDueDate})`;
}

function HomeScreen({ navigation }: Props): React.JSX.Element {
  const familyStatus = useFamilyStore(state => state.status);
  const family = useFamilyStore(state => state.family);
  const fetchMyFamily = useFamilyStore(state => state.fetchMyFamily);
  const chores = useChoreStore(state => state.chores);
  const choreStatus = useChoreStore(state => state.status);
  const error = useChoreStore(state => state.error);
  const fetchChores = useChoreStore(state => state.fetchChores);
  const completeChore = useChoreStore(state => state.completeChore);

  React.useEffect(() => {
    if (familyStatus === 'loading') {
      fetchMyFamily();
    }
  }, [familyStatus, fetchMyFamily]);

  React.useEffect(() => {
    if (family?.id) {
      fetchChores(family.id);
    }
  }, [family?.id, fetchChores]);

  if (familyStatus === 'loading' || choreStatus === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (familyStatus === 'none') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>먼저 가족 탭에서 가족을 만들거나 참여해주세요.</Text>
      </View>
    );
  }

  const today = toDateString(new Date());
  const todayChores = chores
    .filter(c => c.nextDueDate <= today)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const upcomingChores = chores
    .filter(c => c.nextDueDate > today)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  const renderChore = (item: ChoreRow) => (
    <View style={styles.choreRow} key={item.id}>
      <Pressable
        style={styles.choreInfo}
        onPress={() => navigation.navigate('ChoreForm', { choreId: item.id })}>
        <Text style={styles.choreTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.choreDescription}>{item.description}</Text>
        ) : null}
        <Text style={styles.choreDue}>{formatDueLabel(item.nextDueDate, today)}</Text>
      </Pressable>
      <Pressable style={styles.completeButton} onPress={() => completeChore(item)}>
        <Text style={styles.completeButtonText}>완료</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate('ChoreForm', undefined)}>
        <Text style={styles.addButtonText}>+ 집안일 추가</Text>
      </Pressable>

      <ScrollView>
        <Text style={styles.sectionTitle}>오늘 할 일 ({todayChores.length})</Text>
        {todayChores.length === 0 ? (
          <Text style={styles.emptySection}>오늘 할 일이 없습니다.</Text>
        ) : (
          todayChores.map(renderChore)
        )}

        <Text style={styles.sectionTitle}>예정된 집안일 ({upcomingChores.length})</Text>
        {upcomingChores.length === 0 ? (
          <Text style={styles.emptySection}>예정된 집안일이 없습니다.</Text>
        ) : (
          upcomingChores.map(renderChore)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  emptySection: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  choreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  choreInfo: {
    flex: 1,
    marginRight: 12,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  choreDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  choreDue: {
    fontSize: 12,
    color: '#2f6fed',
    marginTop: 4,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#2f6fed',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;
