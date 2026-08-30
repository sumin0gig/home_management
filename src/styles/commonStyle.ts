export const colors = {
  default: '#FFF9F2',
  red: '#EFAFA4',
  yellow: '#FBD9A0',
  yellowGreen: '#D9F2A6',
  green: '#8ee0a1',
  teal: '#b2efed',
  blue: '#A9DDF2',
  gray: '#9A9A9A',
  white: '#FAFAFA',
  black: '#333333',
} as const;

export const commonColor = {
  overlay: 'rgba(0, 0, 0, 0.4)',
  negative: '#D9705B',
  touchable: '#a36044',
  backgroundColor: colors.white,
  textSecondary: colors.gray,
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
