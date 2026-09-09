import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TaskWidget } from './TaskWidget';
import {
  WIDGET_TOP_TASKS_STORAGE_KEY,
  type WidgetTaskItem,
} from './taskWidgetSync';

// Handles widget lifecycle events fired by Android outside of the app's
// normal JS runtime (e.g. widget just added, or OS-triggered refresh) by
// rendering the last task snapshot the app saved via syncTaskWidget.
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  if (props.widgetInfo.widgetName !== 'TaskWidget') {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const stored = await AsyncStorage.getItem( WIDGET_TOP_TASKS_STORAGE_KEY );
      const tasks: WidgetTaskItem[] = stored ? JSON.parse(stored) : [];
      props.renderWidget(<TaskWidget tasks={tasks} />);
      break;
    }
    default:
      break;
  }
}
