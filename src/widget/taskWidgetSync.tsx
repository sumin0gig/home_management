import React from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { toDateString } from '../utils/date';
import type { TaskRow } from '../store/useTaskStore';
import { TaskWidget } from './TaskWidget';

export const WIDGET_TOP_TASKS_STORAGE_KEY = 'TaskWidget:topTasks';
const WIDGET_TOP_TASKS_LIMIT = 3;

export interface WidgetTaskItem {
  id: string;
  title: string;
  dueLabel: string;
}

function formatDueLabel(nextDueDate: string, today: string): string {
  if (nextDueDate < today) {
    return '기한 지남';
  }
  if (nextDueDate === today) {
    return '오늘';
  }
  return `예정 (${nextDueDate})`;
}

export function getTopTasks(
  tasks: TaskRow[],
  limit = WIDGET_TOP_TASKS_LIMIT,
): WidgetTaskItem[] {
  const today = toDateString( new Date() );
  return [...tasks]
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, limit)
    .map(task => ({
      id: task.id,
      title: task.title,
      dueLabel: formatDueLabel(task.nextDueDate, today),
    }));
}

// Widgets can't call the Amplify API directly (no auth context in the widget
// process), so the app pushes the current top tasks into shared storage
// whenever they change, and the widget just renders the last snapshot.
export async function syncTaskWidget(tasks: TaskRow[]): Promise<void> {
  const topTasks = getTopTasks( tasks );
  await AsyncStorage.setItem(
    WIDGET_TOP_TASKS_STORAGE_KEY,
    JSON.stringify(topTasks),
  );

  if (Platform.OS === 'android') {
    await requestWidgetUpdate({
      widgetName: 'TaskWidget',
      renderWidget: () => <TaskWidget tasks={topTasks} />,
    });
  } else if (Platform.OS === 'ios' && NativeModules.WidgetDataBridge) {
    // Only present once the WidgetKit extension has been added in Xcode (see
    // ios/HomeManagementWidget) — guarded so this is a no-op until then.
    NativeModules.WidgetDataBridge.saveTopTasks(JSON.stringify(topTasks));
  }
}
