import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { ChoreWidget } from './ChoreWidget';
import { WIDGET_TOP_CHORES_STORAGE_KEY, type WidgetChoreItem } from './choreWidgetSync';

// Handles widget lifecycle events fired by Android outside of the app's
// normal JS runtime (e.g. widget just added, or OS-triggered refresh) by
// rendering the last chore snapshot the app saved via syncChoreWidget.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetInfo.widgetName !== 'ChoreWidget') {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const stored = await AsyncStorage.getItem(WIDGET_TOP_CHORES_STORAGE_KEY);
      const chores: WidgetChoreItem[] = stored ? JSON.parse(stored) : [];
      props.renderWidget(<ChoreWidget chores={chores} />);
      break;
    }
    default:
      break;
  }
}
