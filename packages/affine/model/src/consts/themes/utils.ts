import {
  type AffineThemeKeyV2,
  darkThemeV2,
  lightThemeV2,
} from '@toeverything/theme/v2';

import type { Color } from '../color.js';
import type { Palette } from './types.js';

// Converts a color map to color list.
export function buildPalettes(
  obj: Record<string, Color>,
  prefix = ''
): Palette[] {
  return Object.entries<Color>(obj).map(([key, value]) => ({
    key: `${prefix}${key}`,
    value,
  }));
}

export function getColorByKey(key: AffineThemeKeyV2): Color {
  const dark = darkThemeV2[key];
  const light = lightThemeV2[key];
  if (dark === light) return dark;
  return { dark, light };
}
