export const colors = {
  default: '#FFF9F2',
  red: '#EFAFA4',
  yellow: '#FBD9A0',
  yellowGreen: '#D9F2A6',
  green: '#8ee0a1',
  teal: '#b2efed',
  blue: '#A9DDF2',
  negative: '#D9705B',
  gray: '#9A9A9A',
  white: '#F2F2F2',
  black: '#333333',
  overlay: 'rgba(0, 0, 0, 0.4)',
  touchable: '#2f6fed',
} as const;

export const commonStyle = {} as const;

export const ROOM_COLOR_PALETTE = [
  colors.red, '#F2BDA6', colors.yellow, '#F2EBA6', colors.yellowGreen,
  colors.green, colors.teal, colors.blue, '#A6C9F2', '#BDA6F2',
] as const;
