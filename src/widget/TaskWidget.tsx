/* eslint-disable react-native/no-inline-styles -- widget style objects aren't RN StyleSheet styles */
import React from 'react';
import {
  FlexWidget,
  SvgWidget,
  TextWidget,
  type ColorProp,
} from 'react-native-android-widget';
import { colors, commonColor } from '../styles/commonStyle';
import {
  DEFAULT_WIDGET_SIZE,
  TASK_LIST_DEEP_LINK,
  WIDGET_PADDING,
  layoutWidgetGrid,
  mascotFaceSvg,
  selectTodayWidgetTasks,
  taskDeepLink,
  type WidgetSnapshot,
  type WidgetTask,
} from './widgetSnapshot';

// commonStyle의 색은 위젯 색 타입('#…' / 'rgba(…)')과 같은 문자열이다.
const c = (color: string) => color as ColorProp;

const HEADER_FACE_SIZE = 28;
const EMPTY_FACE_SIZE = 52;
const CELL_HEIGHT = 32;
// 마스코트 얼굴 SVG의 세로/가로 비율 (mascotFaceSvg의 viewBox)
const FACE_ASPECT = 108 / 88;

interface TaskWidgetProps {
  snapshot: WidgetSnapshot;
  // 'YYYY-MM-DD'. 그릴 때마다 이 날 기준으로 오늘 할 일을 고른다.
  today: string;
  width?: number;
  height?: number;
}

function TaskCell({ task }: { task: WidgetTask }): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: taskDeepLink(task.id) }}
      style={{
        flex: 1,
        height: CELL_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c(colors.white),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: c(commonColor.subtleBorder),
        paddingVertical: 8,
        paddingHorizontal: 9,
      }}
    >
      <FlexWidget
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          marginRight: 6,
          backgroundColor: c(task.roomColor ?? colors.lightGray),
        }}
      />
      <TextWidget
        text={task.title}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: c(commonColor.textDefault),
        }}
      />
    </FlexWidget>
  );
}

function MoreCell({ count }: { count: number }): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: TASK_LIST_DEEP_LINK }}
      style={{
        flex: 1,
        height: CELL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        // 위젯은 점선 테두리를 그릴 수 없어서 진한 테두리 + 바탕색 없음으로 구분한다
        borderWidth: 1,
        borderColor: c(commonColor.border),
      }}
    >
      <TextWidget
        text={`+${count}개`}
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: c(commonColor.textMuted),
        }}
      />
    </FlexWidget>
  );
}

function Spacer(): React.JSX.Element {
  return <FlexWidget style={{ flex: 1, height: CELL_HEIGHT }} />;
}

// 홈 화면 위젯. 오늘 할 일 이름만 보여준다 (기한 정보·방 이름 없음).
export function TaskWidget({
  snapshot,
  today,
  width = DEFAULT_WIDGET_SIZE.width,
  height = DEFAULT_WIDGET_SIZE.height,
}: TaskWidgetProps): React.JSX.Element {
  const todayTasks = selectTodayWidgetTasks(snapshot, today);
  const { columns, shown, overflow } = layoutWidgetGrid(todayTasks, {
    width,
    height,
  });
  const mascot = snapshot.showMascot ? snapshot.mascot : null;

  // FlexWidget은 줄바꿈 배치가 불확실해서, 행 단위 가로 FlexWidget에 칸을
  // columns개씩 넣는다. 모자란 자리는 빈 칸으로 채워 너비를 맞춘다.
  const cells: React.JSX.Element[] = shown.map(task => (
    <TaskCell key={task.id} task={task} />
  ));
  if (overflow > 0) {
    cells.push(<MoreCell key="more" count={overflow} />);
  }
  const rows: React.JSX.Element[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    const row = cells.slice(i, i + columns);
    while (row.length < columns) {
      row.push(<Spacer key={`spacer-${i}-${row.length}`} />);
    }
    rows.push(row);
  }

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: TASK_LIST_DEEP_LINK }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: c(colors.default),
        borderRadius: 22,
        padding: WIDGET_PADDING,
      }}
    >
      {todayTasks.length === 0 ? (
        <FlexWidget
          style={{
            height: 'match_parent',
            width: 'match_parent',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mascot ? (
            <SvgWidget
              svg={mascotFaceSvg(mascot, EMPTY_FACE_SIZE)}
              style={{
                width: EMPTY_FACE_SIZE,
                height: Math.round(EMPTY_FACE_SIZE * FACE_ASPECT),
                marginBottom: 6,
              }}
            />
          ) : null}
          <TextWidget
            text="오늘 할 일 없어요"
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: c(commonColor.textDefault),
            }}
          />
          <TextWidget
            text="우리집이 깨끗해요"
            style={{
              fontSize: 12,
              color: c(commonColor.textMuted),
              marginTop: 2,
            }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          <FlexWidget
            style={{
              width: 'match_parent',
              height: 36,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            {mascot ? (
              <SvgWidget
                svg={mascotFaceSvg(mascot, HEADER_FACE_SIZE)}
                style={{
                  width: HEADER_FACE_SIZE,
                  height: Math.round(HEADER_FACE_SIZE * FACE_ASPECT),
                  marginRight: 6,
                }}
              />
            ) : null}
            <TextWidget
              text="오늘 할 일"
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: c(commonColor.textDefault),
              }}
            />
            <FlexWidget style={{ flex: 1 }} />
            <FlexWidget
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: c(commonColor.touchable),
              }}
            >
              <TextWidget
                text={String(todayTasks.length)}
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: c(colors.white),
                }}
              />
            </FlexWidget>
          </FlexWidget>
          {rows.map((row, index) => (
            <FlexWidget
              key={`row-${index}`}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                flexGap: 6,
                marginBottom: 6,
              }}
            >
              {row}
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
