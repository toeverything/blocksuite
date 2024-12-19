import {
  type AffineThemeKeyV2,
  darkThemeV2,
  lightThemeV2,
} from '@toeverything/theme/v2';
import { z } from 'zod';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
}

export const ColorSchema = z.union([
  z.string(),
  z.record(
    z.union([z.nativeEnum(ColorScheme), z.literal('normal')]),
    z.string()
  ),
]);

export type Color = z.infer<typeof ColorSchema>;

export function getColorByKey(key: AffineThemeKeyV2): Color {
  const dark = darkThemeV2[key];
  const light = lightThemeV2[key];
  if (dark === light) return dark;
  return { dark, light };
}
