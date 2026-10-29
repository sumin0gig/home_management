import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WIDGET_SHOW_MASCOT_STORAGE_KEY,
  WIDGET_SNAPSHOT_STORAGE_KEY,
  parseWidgetSnapshot,
  type WidgetSnapshot,
} from './widgetSnapshot';

// 스토어를 가져오지 않는다 — 런처의 위젯 설정 화면처럼 앱 데이터가 아직 안
// 불러와진 곳에서도 쓰기 때문이다.

// 위젯에 마스코트를 보일지 (앱 전체에 하나, 기본 true)
export async function loadWidgetShowMascot(): Promise<boolean> {
  return (
    (await AsyncStorage.getItem(WIDGET_SHOW_MASCOT_STORAGE_KEY)) !== 'false'
  );
}

// 설정을 저장하고, 저장된 스냅샷의 showMascot만 바꿔서 돌려준다 (할 일 목록은 그대로).
export async function storeWidgetShowMascot(
  showMascot: boolean,
): Promise<WidgetSnapshot> {
  const snapshot = {
    ...parseWidgetSnapshot(
      await AsyncStorage.getItem(WIDGET_SNAPSHOT_STORAGE_KEY),
    ),
    showMascot,
  };
  await AsyncStorage.multiSet([
    [WIDGET_SHOW_MASCOT_STORAGE_KEY, showMascot ? 'true' : 'false'],
    [WIDGET_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot)],
  ]);
  return snapshot;
}
