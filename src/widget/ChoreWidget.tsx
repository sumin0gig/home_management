/* eslint-disable react-native/no-inline-styles -- widget style objects aren't RN StyleSheet styles */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetChoreItem } from './choreWidgetSync';

const CHORE_LIST_DEEP_LINK = 'homemanagement://chores';

interface ChoreWidgetProps {
  chores: WidgetChoreItem[];
}

export function ChoreWidget({ chores }: ChoreWidgetProps): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: CHORE_LIST_DEEP_LINK }}
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
        chores.length === 0
        ? <TextWidget
          text="모든 집안일을 완료했어요"
          style={{ fontSize: 14, color: '#333333' }}
        />
        : chores.map(chore => (
          <FlexWidget
            key={chore.id}
            style={{
              flexDirection: 'column',
              width: 'match_parent',
              marginBottom: 8,
            }}
          >
            <TextWidget
              text={chore.title}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 15, fontWeight: '600', color: '#111111' }}
            />
            <TextWidget
              text={chore.dueLabel}
              style={{ fontSize: 12, color: '#2f6fed', fontWeight: '600' }}
            />
          </FlexWidget>
        ))
      }
    </FlexWidget>
  );
}
