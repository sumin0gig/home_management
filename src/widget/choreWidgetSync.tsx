import React from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { toDateString, type ChoreRow } from '../api/chore';
import { ChoreWidget } from './ChoreWidget';

export const WIDGET_TOP_CHORES_STORAGE_KEY = 'ChoreWidget:topChores';
const WIDGET_TOP_CHORES_LIMIT = 3;

export interface WidgetChoreItem {
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

export function getTopChores(
  chores: ChoreRow[],
  limit = WIDGET_TOP_CHORES_LIMIT,
): WidgetChoreItem[] {
  const today = toDateString(new Date());
  return [...chores]
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, limit)
    .map(chore => ({
      id: chore.id,
      title: chore.title,
      dueLabel: formatDueLabel(chore.nextDueDate, today),
    }));
}

// Widgets can't call the Amplify API directly (no auth context in the widget
// process), so the app pushes the current top chores into shared storage
// whenever they change, and the widget just renders the last snapshot.
export async function syncChoreWidget(chores: ChoreRow[]): Promise<void> {
  const topChores = getTopChores(chores);
  await AsyncStorage.setItem(WIDGET_TOP_CHORES_STORAGE_KEY, JSON.stringify(topChores));

  if (Platform.OS === 'android') {
    await requestWidgetUpdate({
      widgetName: 'ChoreWidget',
      renderWidget: () => <ChoreWidget chores={topChores} />,
    });
  } else if (Platform.OS === 'ios' && NativeModules.WidgetDataBridge) {
    // Only present once the WidgetKit extension has been added in Xcode (see
    // ios/HomeManagementWidget) — guarded so this is a no-op until then.
    NativeModules.WidgetDataBridge.saveTopChores(JSON.stringify(topChores));
  }
}
