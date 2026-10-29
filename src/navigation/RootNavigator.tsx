import React, { useEffect } from 'react';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import FamilyOnboarding from '../components/FamilyOnboarding/FamilyOnboarding';
import ForceUpdateScreen from '../components/ForceUpdate/ForceUpdateScreen';
import MascotSetup from '../components/MascotSetup/MascotSetup';
import RoomSetupScreen from '../components/RoomSetupScreen/RoomSetupScreen';
import RoomWaitingScreen from '../components/RoomWaitingScreen/RoomWaitingScreen';
import StartupScreen from '../components/Onboarding/StartupScreen';
import WelcomeScreen from '../components/Onboarding/WelcomeScreen';
import { useWelcomeGate } from '../components/Onboarding/useWelcomeGate';
import { setPendingRoute } from './pendingNavigation';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useMascotStore } from '../store/useMascotStore';
import { useRoomStore } from '../store/useRoomStore';
import { usePushNotifications } from '../notifications/usePushNotifications';

function RootNavigator(): React.JSX.Element {
  const updateStatus = useAppUpdateStore( state => state.status );
  const checkForUpdate = useAppUpdateStore( state => state.checkForUpdate );
  const subscribeToAppState = useAppUpdateStore(
    state => state.subscribeToAppState,
  );

  const authStatus = useAuthStore( state => state.status );
  const checkAuthStatus = useAuthStore( state => state.checkAuthStatus );
  const subscribeToAuthEvents = useAuthStore(
    state => state.subscribeToAuthEvents,
  );

  usePushNotifications(authStatus === 'signedIn');

  const mascotStatus = useMascotStore( state => state.status );
  const fetchMyMascot = useMascotStore( state => state.fetchMyMascot );

  const familyStatus = useFamilyStore( state => state.status );
  const fetchMyFamily = useFamilyStore( state => state.fetchMyFamily );
  const family = useFamilyStore( state => state.family );
  const membership = useFamilyStore( state => state.membership );

  // 참여자가 집을 기다리는 동안 마스코트를 먼저 만들러 갔는지
  const [makeMascotWhileWaiting, setMakeMascotWhileWaiting] = React.useState( false );

  const roomStatus = useRoomStore( state => state.status );
  const rooms = useRoomStore( state => state.rooms );
  const houseSetupPending = useRoomStore( state => state.houseSetupPending );
  const fetchRooms = useRoomStore( state => state.fetchRooms );

  useEffect(() => {
    checkForUpdate();
    const unsubscribe = subscribeToAppState();
    return unsubscribe;
  }, [checkForUpdate, subscribeToAppState]);

  useEffect(() => {
    checkAuthStatus();
    const unsubscribe = subscribeToAuthEvents();
    return unsubscribe;
  }, [checkAuthStatus, subscribeToAuthEvents]);

  useEffect(() => {
    if (authStatus === 'signedIn') {
      fetchMyFamily();
      fetchMyMascot();
    }
  }, [authStatus, fetchMyFamily, fetchMyMascot]);

  useEffect(() => {
    if (familyStatus === 'joined' && family) {
      fetchRooms(family.id);
    }
  }, [familyStatus, family, fetchRooms]);

  const isLoading =
    updateStatus === "checking"
    || authStatus === "loading"
    || (authStatus === 'signedIn' && (familyStatus === 'loading' || mascotStatus === 'loading'))
  ;
  const isRoomsLoading = familyStatus === 'joined' && roomStatus === 'idle';

  const isOwner = membership?.role === 'OWNER';
  // 집과 마스코트가 모두 준비돼 홈으로 들어갈 수 있는 상태
  const isReadyForHome =
    authStatus === 'signedIn' &&
    familyStatus === 'joined' &&
    !isRoomsLoading &&
    rooms.length > 0 &&
    !(isOwner && houseSetupPending) &&
    mascotStatus === 'created';
  const welcome = useWelcomeGate(isReadyForHome, mascotStatus);

  if (updateStatus === 'updateRequired') return <ForceUpdateScreen />;

  if (isLoading) {
    return <StartupScreen />;
  }

  if (authStatus !== 'signedIn') return <AuthNavigator />;

  if (familyStatus === 'none') return <FamilyOnboarding />;

  if (isRoomsLoading) {
    return <StartupScreen />;
  }

  // 관리자가 집을 만드는 중이면 첫 방이 생겨도 다 만들 때까지 집 만들기에 남는다.
  if (isOwner && (rooms.length === 0 || houseSetupPending)) {
    return <RoomSetupScreen />;
  }

  // 참여자이고 방이 아직 없을 때: 마스코트가 없고 카드에서 "마스코트 만들기"를
  // 눌렀으면 마스코트부터, 아니면(마스코트를 만든 뒤 포함) 대기 화면.
  if (rooms.length === 0) {
    if (mascotStatus === 'none' && makeMascotWhileWaiting) {
      return <MascotSetup />;
    }
    return (
      <RoomWaitingScreen onMakeMascot={() => setMakeMascotWhileWaiting(true)} />
    );
  }

  if (mascotStatus === 'none') {
    return <MascotSetup />;
  }

  if (welcome.state === 'checking') {
    return <StartupScreen />;
  }

  if (welcome.state === 'show') {
    return (
      <WelcomeScreen
        isOwner={isOwner}
        onStart={welcome.finish}
        onInvite={() => {
          setPendingRoute('AddFamilyMember');
          welcome.finish();
        }}
      />
    );
  }

  return <MainNavigator />;
}

export default RootNavigator;
