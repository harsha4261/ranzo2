import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  display: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.inkNavy,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.inkNavy,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.inkNavy,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.inkBody,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.inkNavy,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.inkMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof Typography;
