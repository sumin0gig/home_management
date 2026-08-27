import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { signInWithGoogle, getAuthErrorMessage } from '../api/auth';
import { commonStyle } from '../styles/commonStyle';

function LoginScreen(): React.JSX.Element {
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HomeManagement</Text>
      <Text style={styles.description}>Google 계정으로 로그인해주세요.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleGoogleSignIn}>
        <Text style={styles.buttonText}>Google로 로그인</Text>
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
  error: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
