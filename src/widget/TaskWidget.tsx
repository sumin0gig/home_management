/* eslint-disable react-native/no-inline-styles -- widget style objects aren't RN StyleSheet styles */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTaskItem } from './taskWidgetSync';

const TASK_LIST_DEEP_LINK = 'homemanagement://tasks';

interface TaskWidgetProps {
  tasks: WidgetTaskItem[];
}

export function TaskWidget({ tasks }: TaskWidgetProps): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: TASK_LIST_DEEP_LINK }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="할 일"
        style={{ fontSize: 13, color: '#888888', marginBottom: 8 }}
      />
      {
        tasks.length === 0
        ? <TextWidget
          text="모든 집안일을 완료했어요"
          style={{ fontSize: 14, color: '#333333' }}
        />
        : tasks.map(task => (
          <FlexWidget
            key={task.id}
            style={{
              flexDirection: 'column',
              width: 'match_parent',
              marginBottom: 8,
            }}
          >
            <TextWidget
              text={task.title}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 15, fontWeight: '600', color: '#111111' }}
            />
            <TextWidget
              text={task.dueLabel}
              style={{ fontSize: 12, color: '#2f6fed', fontWeight: '600' }}
            />
          </FlexWidget>
        ))
      }
    </FlexWidget>
  );
}
