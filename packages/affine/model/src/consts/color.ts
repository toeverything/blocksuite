import { z } from 'zod';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
}

const ColorNormalSchema = z.object({
  normal: z.string(),
});

const ColorDarkLightSchema = z.object({
  [ColorScheme.Dark]: z.string(),
  [ColorScheme.Light]: z.string(),
});

export const ColorSchema = z.union([
  z.string(),
  ColorNormalSchema,
  ColorDarkLightSchema,
]);

export type Color = z.infer<typeof ColorSchema>;

// Converts `Color` type to string.
export function resolveColor(
  color: Color,
  colorScheme: ColorScheme,
  fallback = 'transparent'
): string {
  let value = fallback;

  if (typeof color === 'object') {
    if (ColorScheme.Dark in color && ColorScheme.Light in color) {
      value = color[colorScheme];
    } else if ('normal' in color) {
      value = color.normal;
    }
  } else {
    value = color;
  }

  if (!value) {
    value = fallback;
  }

  return value;
}

export function isTransparent(color: Color) {
  return (
    typeof color === 'string' && color.toLowerCase().endsWith('transparent')
  );
}
