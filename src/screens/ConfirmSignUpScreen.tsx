import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useSignUpStore } from '../store/useSignUpStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'ConfirmSignUp'>;

function ConfirmSignUpScreen({ navigation }: Props): React.JSX.Element {
  const email = useSignUpStore(state => state.email);
  const confirmationCode = useSignUpStore(state => state.confirmationCode);
  const loading = useSignUpStore(state => state.loading);
  const error = useSignUpStore(state => state.error);
  const setConfirmationCode = useSignUpStore(state => state.setConfirmationCode);
  const submitConfirmation = useSignUpStore(state => state.submitConfirmation);
  const resendCode = useSignUpStore(state => state.resendCode);
  const reset = useSignUpStore(state => state.reset);

  const handleSubmit = async () => {
    const complete = await submitConfirmation();
    if (complete) {
      reset();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>이메일 인증</Text>
      <Text style={styles.description}>{email}로 인증 코드를 보냈습니다.</Text>

      <TextInput
        style={styles.input}
        placeholder="인증 코드"
        keyboardType="number-pad"
        value={confirmationCode}
        onChangeText={setConfirmationCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>인증하기</Text>
        )}
      </Pressable>

      <Pressable style={styles.resendButton} onPress={resendCode} disabled={loading}>
        <Text style={styles.resendText}>코드 재전송</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#2f6fed',
    fontSize: 14,
  },
});

export default ConfirmSignUpScreen;
