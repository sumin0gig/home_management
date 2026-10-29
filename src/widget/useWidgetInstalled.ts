import React from 'react';
import { AppState, Platform } from 'react-native';
import { getWidgetInfo } from 'react-native-android-widget';
import { WIDGET_NAME } from './widgetSnapshot';

// 홈 화면에 위젯이 하나라도 놓여 있는지. requestPinWidget이 true를 돌려줘도
// 런처가 확인 창을 띄웠다는 뜻일 뿐이라, 설치 여부는 항상 이걸로 다시 확인한다.
export async function checkWidgetInstalled(): Promise<boolean | null> {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    return (await getWidgetInfo(WIDGET_NAME)).length > 0;
  } catch {
    return null;
  }
}

interface FocusSource {
  addListener: (event: 'focus', callback: () => void) => () => void;
}

// Android: 설치됨 true / 안 됨 false (확인 전 null). iOS는 항상 null.
// 화면 포커스(navigation을 넘기면)와 앱 복귀 때 다시 확인한다.
export function useWidgetInstalled(navigation?: FocusSource): boolean | null {
  const [installed, setInstalled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let active = true;
    const check = () =>
      checkWidgetInstalled().then(value => {
        if (active) {
          setInstalled(value);
        }
      });
    check();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        check();
      }
    });
    const removeFocus = navigation?.addListener('focus', check);
    return () => {
      active = false;
      appState.remove();
      removeFocus?.();
    };
  }, [navigation]);

  return installed;
}
