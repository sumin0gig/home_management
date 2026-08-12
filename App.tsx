/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { useAuthStore } from './src/store/useAuthStore';

Amplify.configure(outputs);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const status = useAuthStore(state => state.status);
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const subscribeToAuthEvents = useAuthStore(state => state.subscribeToAuthEvents);

  useEffect(() => {
    checkAuthStatus();
    const unsubscribe = subscribeToAuthEvents();
    return unsubscribe;
  }, [checkAuthStatus, subscribeToAuthEvents]);

  if (status === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        {status === 'signedIn' ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
