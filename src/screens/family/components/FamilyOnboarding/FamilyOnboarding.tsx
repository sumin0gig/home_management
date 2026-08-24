import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../../../store/useFamilyStore';
import { signOutUser } from '../../../../api/auth';

function FamilyOnboarding(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const error = useFamilyStore(state => state.error);
  const createFamily = useFamilyStore(state => state.createFamily);
  const joinFamily = useFamilyStore(state => state.joinFamily);

  const [familyName, setFamilyName] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);

  const handleCreate = async () => {
    if (!familyName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await createFamily(familyName.trim());
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
      <Pressable
        style={[styles.logoutLink, { top: insets.top + 16 }]}
        onPress={() => signOutUser()}>
        <Text style={styles.logoutLinkText}>로그아웃</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>가족 만들기</Text>
        <TextInput
          style={styles.input}
          placeholder="가족 이름"
          value={familyName}
          onChangeText={setFamilyName}
        />
        <Pressable style={styles.button} onPress={handleCreate} disabled={isCreating}>
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
  logoutLink: {
    position: 'absolute',
    right: 16,
  },
  logoutLinkText: {
    color: '#555',
    fontSize: 13,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FamilyOnboarding;
