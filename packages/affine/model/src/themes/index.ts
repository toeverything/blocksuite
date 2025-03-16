import { DefaultTheme } from './default';
import type { Theme } from './types';

export * from './color';
export { DefaultTheme } from './default';
export * from './types';

export const Themes: Record<string, Theme> = {
  default: DefaultTheme,
};
