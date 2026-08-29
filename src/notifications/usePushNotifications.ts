import { useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
} from '@react-native-firebase/messaging';
import { registerDeviceToken } from '../api/deviceToken';

async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  await requestPermission(getMessaging());
}

export function usePushNotifications(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const messagingInstance = getMessaging();

    (async () => {
      try {
        await requestNotificationPermission();
        const token = await getToken(messagingInstance);
        await registerDeviceToken(token);
      } catch {
        // 알림 권한 거부 등은 조용히 무시한다 — 알림 없이도 앱은 정상 동작해야 한다.
      }
    })();

    const unsubscribeTokenRefresh = onTokenRefresh(
      messagingInstance,
      async token => {
        try {
          await registerDeviceToken(token);
        } catch {
          // 무시
        }
      },
    );

    const unsubscribeMessage = onMessage(
      messagingInstance,
      async remoteMessage => {
        const title = remoteMessage.notification?.title ?? '집안일 알림';
        const body = remoteMessage.notification?.body ?? '';
        Alert.alert(title, body);
      },
    );

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeMessage();
    };
  }, [enabled]);
}
