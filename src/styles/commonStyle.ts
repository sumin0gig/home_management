export const colors = {
  default: '#FFF9F2',
  red: '#EFAFA4',
  yellow: '#FBD9A0',
  yellowGreen: '#D9F2A6',
  green: '#8ee0a1',
  teal: '#b2efed',
  blue: '#A9DDF2',
  white: '#FFFFFF',
  lightGray: '#F2F2F2',
  gray: '#9A9A9A',
  darkGray: '#555555',
  black: '#333333',
  pureBlack: '#000000',
  tipBackground: '#fff6e5',
  tipLabel: '#b8860b',
  tipContent: '#7a5c00',
} as const;

export const commonColor = {
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',
  negative: '#D9705B',
  error: '#d32f2f',
  touchable: '#a36044',
  touchableSoft: '#f3e3da',
  backgroundColor: colors.white,
  textSecondary: colors.gray,
  textDefault: colors.black,
  textMuted: '#666666',
  border: '#cccccc',
  subtleBorder: 'rgba(0, 0, 0, 0.08)',
  divider: '#eeeeee',
  info: '#2f6fed',
  // 기한 상태 라벨 전용. 묶음 제목·요약·평면도 배지에는 쓰지 않는다.
  duePast: '#B42318', // "4일 지남" (흰 배경 대비 6.6:1)
  dueToday: '#9A5507', // "오늘"
  dueUpcoming: '#666666', // "내일", "D-n" (textMuted와 같은 값)
} as const;

// 기한 상태 라벨 색. 상태 라벨은 이 함수(=due* 토큰)로만 칠한다.
export function dueStatusColor(kind: 'past' | 'today' | 'upcoming'): string {
  switch (kind) {
    case 'past':
      return commonColor.duePast;
    case 'today':
      return commonColor.dueToday;
    case 'upcoming':
      return commonColor.dueUpcoming;
  }
}

export const commonStyle = {} as const;

export const ROOM_COLOR_PALETTE = [
  colors.red,
  '#F2BDA6',
  colors.yellow,
  '#F2EBA6',
  colors.yellowGreen,
  colors.green,
  colors.teal,
  colors.blue,
  '#A6C9F2',
  '#BDA6F2',
] as const;
