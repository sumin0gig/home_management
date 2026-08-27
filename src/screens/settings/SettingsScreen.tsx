import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { signOutUser, getAuthErrorMessage } from '../../api/auth';
import { commonStyle } from '../../styles/commonStyle';

function SettingsScreen(): React.JSX.Element {
  const [error, setError] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>로그아웃</Text>
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

export default SettingsScreen;
