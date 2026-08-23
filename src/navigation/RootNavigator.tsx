import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import FamilyOnboarding from '../screens/family/components/FamilyOnboarding';
import { useAuthStore } from '../store/useAuthStore';
import { useFamilyStore } from '../store/useFamilyStore';

function RootNavigator(): React.JSX.Element {
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

  const isLoading =
    authStatus === 'loading' || (authStatus === 'signedIn' && familyStatus === 'loading');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authStatus !== 'signedIn') {
    return <AuthNavigator />;
  }

  if (familyStatus === 'none') {
    return <FamilyOnboarding />;
  }

  return <MainNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
