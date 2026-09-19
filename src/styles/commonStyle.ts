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
  backgroundColor: colors.white,
  textSecondary: colors.gray,
  textDefault: colors.black,
  textMuted: '#666666',
  border: '#cccccc',
  subtleBorder: 'rgba(0, 0, 0, 0.08)',
  divider: '#eeeeee',
  info: '#2f6fed',
} as const;

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
