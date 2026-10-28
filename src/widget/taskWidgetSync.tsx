import React from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { toDateString } from '../utils/date';
import { useTaskStore } from '../store/useTaskStore';
import { useRoomStore } from '../store/useRoomStore';
import { useMascotStore } from '../store/useMascotStore';
import { TaskWidget } from './TaskWidget';
import {
  WIDGET_NAME,
  WIDGET_SNAPSHOT_STORAGE_KEY,
  buildWidgetSnapshot,
  type WidgetSnapshot,
} from './widgetSnapshot';
import { loadWidgetShowMascot, storeWidgetShowMascot } from './widgetSettings';

export { loadWidgetShowMascot };

// 앱 설정에서 바꿨을 때: 저장하고 바로 다시 그린다.
export async function saveWidgetShowMascot(showMascot: boolean): Promise<void> {
  await storeWidgetShowMascot(showMascot);
  await syncTaskWidget();
}

// 지금 스토어 상태로 스냅샷을 만든다.
export async function currentWidgetSnapshot(): Promise<WidgetSnapshot> {
  const mascot = useMascotStore.getState().mascot;
  return buildWidgetSnapshot({
    tasks: useTaskStore.getState().tasks,
    rooms: useRoomStore.getState().rooms,
    mascot: mascot
      ? {
          fillColor: mascot.fillColor ?? null,
          earStyle: mascot.earStyle ?? 'ROUND',
        }
      : null,
    showMascot: await loadWidgetShowMascot(),
    today: toDateString(new Date()),
  });
}

// Widgets can't call the Amplify API directly (no auth context in the widget
// process), so the app pushes a snapshot into shared storage whenever tasks,
// rooms or the mascot change, and the widget renders from the last snapshot.
// The snapshot holds due dates (not labels), so the widget can pick "today"
// itself when the OS refreshes it after midnight.
export async function syncTaskWidget(): Promise<void> {
  const snapshot = await currentWidgetSnapshot();
  await AsyncStorage.setItem(
    WIDGET_SNAPSHOT_STORAGE_KEY,
    JSON.stringify(snapshot),
  );

  if (Platform.OS === 'android') {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: info => (
        <TaskWidget
          snapshot={snapshot}
          today={toDateString(new Date())}
          width={info.width}
          height={info.height}
        />
      ),
    });
  } else if (Platform.OS === 'ios' && NativeModules.WidgetDataBridge) {
    // Only present once the WidgetKit extension has been added in Xcode (see
    // ios/HomeManagementWidget) — guarded so this is a no-op until then.
    NativeModules.WidgetDataBridge.saveTopTasks(JSON.stringify(snapshot.tasks));
  }
}
