import type { Theme } from './types.js';

import { DefaultTheme } from './default.js';

export { DefaultTheme } from './default.js';
export * from './types.js';

export const Themes: Record<string, Theme> = {
  default: DefaultTheme,
};
