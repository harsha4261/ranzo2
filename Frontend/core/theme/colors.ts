export const Colors = {
  primary: '#6B2C8C',
  primaryDark: '#4E1F68',
  primarySoft: '#F3E8F7',
  primaryTint: '#E2C9EC',

  inkNavy: '#15172B',
  inkBody: '#2A2D45',
  inkMuted: '#7A7E96',

  surfaceWhite: '#FFFFFF',
  surfaceCanvas: '#FAF7FB',
  divider: '#ECE6F0',

  success: '#1F9D55',
  successSoft: '#E6F5EC',
  warning: '#E0A800',
  warningSoft: '#FFF6DB',
  danger: '#D63B3B',
  dangerSoft: '#FCE6E6',

  black: '#000000',
  white: '#FFFFFF',
  overlay: 'rgba(21, 23, 43, 0.45)',
} as const;

export type ColorToken = keyof typeof Colors;
