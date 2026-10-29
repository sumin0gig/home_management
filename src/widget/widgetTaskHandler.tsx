import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { toDateString } from '../utils/date';
import { TaskWidget } from './TaskWidget';
import {
  WIDGET_NAME,
  WIDGET_SNAPSHOT_STORAGE_KEY,
  parseWidgetSnapshot,
} from './widgetSnapshot';

// Handles widget lifecycle events fired by Android outside of the app's
// normal JS runtime (widget just added, resized, or the OS's periodic
// refresh — updatePeriodMillis). The app only saves due dates, so each
// redraw picks today's tasks against the current date: after midnight the
// widget switches to the new day within one refresh period, without
// opening the app.
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = parseWidgetSnapshot(
        await AsyncStorage.getItem(WIDGET_SNAPSHOT_STORAGE_KEY),
      );
      props.renderWidget(
        <TaskWidget
          snapshot={snapshot}
          today={toDateString(new Date())}
          width={props.widgetInfo.width}
          height={props.widgetInfo.height}
        />,
      );
      break;
    }
    default:
      break;
  }
}
