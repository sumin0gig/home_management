export const colors = {
  default: '#FFF9F2',
  red: '#EFAFA4',
  yellow: '#FBD9A0',
  blue: '#A9DDF2',
  negative: '#D9705B',
  gray: '#9A9A9A',
  white: '#F2F2F2',
  black: '#333333',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const commonStyle = {
  defaultBackgroundColor: colors.default,
  touchableColor: "#2f6fed",
  negativeColor: colors.negative,
} as const;
