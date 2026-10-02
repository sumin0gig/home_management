import { useEffect } from 'react';
import { Alert } from 'react-native';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
} from '@react-native-firebase/messaging';
import { registerDeviceToken } from '../../actions';

export function usePushNotifications(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const messagingInstance = getMessaging();

    getToken(messagingInstance).then(registerDeviceToken);

    const unsubscribeTokenRefresh = onTokenRefresh(
      messagingInstance,
      registerDeviceToken,
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
