/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import FamilyOnboarding from './src/screens/family/components/FamilyOnboarding';
import { useAuthStore } from './src/store/useAuthStore';
import { useFamilyStore } from './src/store/useFamilyStore';

Amplify.configure(outputs);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const authStatus = useAuthStore(state => state.status);
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const subscribeToAuthEvents = useAuthStore(state => state.subscribeToAuthEvents);

  const familyStatus = useFamilyStore(state => state.status);
  const fetchMyFamily = useFamilyStore(state => state.fetchMyFamily);

  useEffect(() => {
    checkAuthStatus();
    const unsubscribe = subscribeToAuthEvents();
    return unsubscribe;
  }, [checkAuthStatus, subscribeToAuthEvents]);

  useEffect(() => {
    if (authStatus === 'signedIn') {
      fetchMyFamily();
    }
  }, [authStatus, fetchMyFamily]);

  const isLoading = authStatus === 'loading' || (authStatus === 'signedIn' && familyStatus === 'loading');

  let content: React.JSX.Element;
  if (isLoading) {
    content = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  } else if (authStatus !== 'signedIn') {
    content = <AuthNavigator />;
  } else if (familyStatus === 'none') {
    content = <FamilyOnboarding />;
  } else {
    content = <MainNavigator />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>{content}</NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
