import { isDueByToday, parseDateString, toDateString } from '../utils/date';
import { colors } from '../styles/commonStyle';

// 앱이 위젯에 넘기는 스냅샷. 상태 라벨("오늘", "지남")을 박아 두지 않고 기한
// 날짜만 저장해서, 위젯이 그릴 때마다 그날 기준으로 오늘 할 일을 고른다.
// 예전 형식(라벨 문자열)과 섞이지 않게 키 이름을 바꿨다.
export const WIDGET_SNAPSHOT_STORAGE_KEY = 'TaskWidget:snapshot:v2';
export const WIDGET_SHOW_MASCOT_STORAGE_KEY = 'widget:showMascot';
export const WIDGET_NAME = 'TaskWidget';

// 앞으로 이 날 수 안에 기한이 있는 일만 저장한다 (지난 일 포함).
const SNAPSHOT_DAYS_AHEAD = 7;
const SNAPSHOT_MAX_TASKS = 12;

export type WidgetEarStyle = 'ROUND' | 'POINTY' | 'FLOPPY';

export interface WidgetTask {
  id: string;
  title: string;
  roomColor: string | null;
  nextDueDate: string;
}

export interface WidgetMascot {
  fillColor: string | null;
  earStyle: WidgetEarStyle;
}

export interface WidgetSnapshot {
  tasks: WidgetTask[];
  mascot: WidgetMascot | null;
  showMascot: boolean;
}

export const EMPTY_WIDGET_SNAPSHOT: WidgetSnapshot = {
  tasks: [],
  mascot: null,
  showMascot: true,
};

// 기한 순(오래된 것 먼저), 같으면 이름 가나다순
export function byDueThenTitle(
  a: { nextDueDate: string; title: string },
  b: { nextDueDate: string; title: string },
): number {
  return (
    a.nextDueDate.localeCompare(b.nextDueDate) ||
    a.title.localeCompare(b.title, 'ko')
  );
}

function addDays(date: string, days: number): string {
  const d = parseDateString(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function buildWidgetSnapshot(input: {
  tasks: { id: string; title: string; roomId: string; nextDueDate: string }[];
  rooms: { id: string; color?: string | null }[];
  mascot: WidgetMascot | null;
  showMascot: boolean;
  today: string;
}): WidgetSnapshot {
  const lastDay = addDays(input.today, SNAPSHOT_DAYS_AHEAD);
  const roomColor = new Map(input.rooms.map(r => [r.id, r.color ?? null]));
  const tasks = input.tasks
    .filter(t => t.nextDueDate <= lastDay)
    .sort(byDueThenTitle)
    .slice(0, SNAPSHOT_MAX_TASKS)
    .map(t => ({
      id: t.id,
      title: t.title,
      roomColor: roomColor.get(t.roomId) ?? null,
      nextDueDate: t.nextDueDate,
    }));
  return { tasks, mascot: input.mascot, showMascot: input.showMascot };
}

// 그릴 때 그날 기준으로 오늘 할 일(기한이 오늘이거나 지난 일)만 고른다.
export function selectTodayWidgetTasks(
  snapshot: WidgetSnapshot,
  today: string,
): WidgetTask[] {
  return snapshot.tasks
    .filter(t => isDueByToday(t.nextDueDate, today))
    .sort(byDueThenTitle);
}

export function parseWidgetSnapshot(stored: string | null): WidgetSnapshot {
  if (!stored) {
    return EMPTY_WIDGET_SNAPSHOT;
  }
  try {
    const parsed = JSON.parse(stored) as Partial<WidgetSnapshot>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      mascot: parsed.mascot ?? null,
      showMascot: parsed.showMascot !== false,
    };
  } catch {
    return EMPTY_WIDGET_SNAPSHOT;
  }
}

// ─── 마스코트 얼굴 SVG (위젯은 react-native-svg를 못 쓰므로 문자열로) ─────────
// MascotHead와 같은 모양: 얼굴 원 + 귀 2개 + 눈 2개. 좌표는 얼굴 중심이 원점.

const FACE_VIEW_BOX = '-44 -66 88 108';
const FACE_ASPECT = 108 / 88;

const EAR_SHAPES: Record<WidgetEarStyle, (fill: string) => string> = {
  ROUND: fill => `<ellipse cx="17" cy="20" rx="15" ry="15" fill="${fill}"/>`,
  POINTY: fill =>
    `<path d="M4,44 Q0,24 17,4 Q34,24 30,44 Q17,50 4,44 Z" fill="${fill}"/>`,
  FLOPPY: fill =>
    `<path d="M15,26 C10,32 -8,44 -16,62 C-20,78 -8,92 8,92 C22,90 28,74 22,60 C18,46 20,32 15,26 Z" fill="${fill}"/>`,
};

export function mascotFaceSvg(mascot: WidgetMascot, width: number): string {
  const fill = mascot.fillColor ?? colors.yellow;
  const ear = (EAR_SHAPES[mascot.earStyle] ?? EAR_SHAPES.ROUND)(fill);
  const height = Math.round(width * FACE_ASPECT);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${FACE_VIEW_BOX}">`,
    `<circle cx="0" cy="0" r="40" fill="${fill}"/>`,
    `<g transform="translate(-40,-63)">${ear}</g>`,
    `<g transform="translate(40,-63) scale(-1,1)">${ear}</g>`,
    `<ellipse cx="-15" cy="-3" rx="7" ry="7" fill="${colors.black}"/>`,
    `<ellipse cx="15" cy="-3" rx="7" ry="7" fill="${colors.black}"/>`,
    '</svg>',
  ].join('');
}

export const TASK_LIST_DEEP_LINK = 'homemanagement://tasks';
export function taskDeepLink(taskId: string): string {
  return `homemanagement://task/${encodeURIComponent(taskId)}`;
}

// ─── 격자 배치 (위젯과 앱 안 미리보기가 같이 쓴다) ───────────────────────
export const WIDGET_PADDING = 12;
const WIDGET_HEADER_HEIGHT = 44;
const WIDGET_ROW_HEIGHT = 40;
const WIDGET_ONE_COLUMN_MAX_WIDTH = 200;
// 4×2 위젯의 대략적인 크기 (widgetInfo가 없을 때)
export const DEFAULT_WIDGET_SIZE = { width: 320, height: 180 };

export interface WidgetGrid {
  columns: number;
  // 칸에 이름을 그릴 할 일
  shown: WidgetTask[];
  // 마지막 칸의 "+N개" (없으면 0)
  overflow: number;
}

// 4×2 기준 2열×3행 = 6칸. 보이는 행 수는 높이로 정하고, 너비가 200dp보다
// 좁으면 1열. 칸보다 할 일이 많으면 마지막 칸을 "+N개"로 쓴다.
export function layoutWidgetGrid(
  tasks: WidgetTask[],
  size: { width: number; height: number },
): WidgetGrid {
  const columns = size.width < WIDGET_ONE_COLUMN_MAX_WIDTH ? 1 : 2;
  const rows = Math.max(
    1,
    Math.round(
      (size.height - WIDGET_PADDING * 2 - WIDGET_HEADER_HEIGHT) /
        WIDGET_ROW_HEIGHT,
    ),
  );
  const capacity = rows * columns;
  if (tasks.length <= capacity) {
    return { columns, shown: tasks, overflow: 0 };
  }
  const shown = tasks.slice(0, capacity - 1);
  return { columns, shown, overflow: tasks.length - shown.length };
}
