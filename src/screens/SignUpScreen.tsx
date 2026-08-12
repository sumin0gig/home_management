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

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const loginId = useSignUpStore(state => state.loginId);
  const email = useSignUpStore(state => state.email);
  const password = useSignUpStore(state => state.password);
  const confirmPassword = useSignUpStore(state => state.confirmPassword);
  const loading = useSignUpStore(state => state.loading);
  const error = useSignUpStore(state => state.error);
  const setLoginId = useSignUpStore(state => state.setLoginId);
  const setEmail = useSignUpStore(state => state.setEmail);
  const setPassword = useSignUpStore(state => state.setPassword);
  const setConfirmPassword = useSignUpStore(state => state.setConfirmPassword);
  const submitSignUp = useSignUpStore(state => state.submitSignUp);

  const handleSubmit = async () => {
    const moved = await submitSignUp();
    if (moved) {
      navigation.navigate('ConfirmSignUp');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="아이디 (영문/숫자/밑줄 4~20자)"
        autoCapitalize="none"
        value={loginId}
        onChangeText={setLoginId}
      />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (8자 이상, 영문+숫자)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>가입하기</Text>
        )}
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
});

export default SignUpScreen;
