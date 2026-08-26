import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import FamilyOnboarding from '../screens/family/components/FamilyOnboarding/FamilyOnboarding';
import RoomSetupScreen from '../screens/family/components/RoomSetupScreen/RoomSetupScreen';
import RoomWaitingScreen from '../screens/family/components/RoomWaitingScreen/RoomWaitingScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useRoomStore } from '../store/useRoomStore';
import { usePushNotifications } from '../notifications/usePushNotifications';

function RootNavigator(): React.JSX.Element {
  const authStatus = useAuthStore(state => state.status);
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const subscribeToAuthEvents = useAuthStore(state => state.subscribeToAuthEvents);

  usePushNotifications(authStatus === 'signedIn');

  const familyStatus = useFamilyStore(state => state.status);
  const fetchMyFamily = useFamilyStore(state => state.fetchMyFamily);
  const family = useFamilyStore(state => state.family);
  const membership = useFamilyStore(state => state.membership);

  const roomStatus = useRoomStore(state => state.status);
  const rooms = useRoomStore(state => state.rooms);
  const fetchRooms = useRoomStore(state => state.fetchRooms);

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

  useEffect(() => {
    if (familyStatus === 'joined' && family) {
      fetchRooms(family.id);
    }
  }, [familyStatus, family, fetchRooms]);

  const isLoading =
    authStatus === 'loading' || (authStatus === 'signedIn' && familyStatus === 'loading');
  const isRoomsLoading = familyStatus === 'joined' && roomStatus === 'idle';

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

  if (isRoomsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (rooms.length === 0) {
    return membership?.role === 'OWNER' ? <RoomSetupScreen /> : <RoomWaitingScreen />;
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
