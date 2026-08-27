import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../../../store/useFamilyStore';
import { useRoomStore } from '../../../../store/useRoomStore';
import { signOutUser } from '../../../../api/auth';
import { commonStyle } from '../../../../styles/commonStyle';

function RoomWaitingScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore(state => state.family);
  const fetchRooms = useRoomStore(state => state.fetchRooms);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!family) {
      return;
    }
    setIsRefreshing(true);
    try {
      await fetchRooms(family.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.logoutLink, { top: insets.top + 16 }]}
        onPress={() => signOutUser()}>
        <Text style={styles.logoutLinkText}>로그아웃</Text>
      </Pressable>

      <Text style={styles.title}>집 구조를 만드는 중이에요</Text>
      <Text style={styles.description}>
        가족 소유자가 아직 방 구조를 만들고 있어요.{'\n'}
        완료되면 자동으로 집안일이 보여요.
      </Text>

      <Pressable style={styles.button} onPress={handleRefresh} disabled={isRefreshing}>
        {isRefreshing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>새로고침</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoomWaitingScreen;
