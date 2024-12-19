// https://www.w3.org/TR/css-color-4/

import type { ColorScheme, Palette } from '@blocksuite/affine-model';

// Red, green, blue. All in the range [0, 1].
export type Rgb = {
  // red 0-1
  r: number;
  // green 0-1
  g: number;
  // blue 0-1
  b: number;
};

// Red, green, blue, alpha. All in the range [0, 1].
export type Rgba = Rgb & {
  // alpha 0-1
  a: number;
};

// Hue, saturation, value. All in the range [0, 1].
export type Hsv = {
  // hue 0-1
  h: number;
  // saturation 0-1
  s: number;
  // value 0-1
  v: number;
};

// Hue, saturation, value, alpha. All in the range [0, 1].
export type Hsva = Hsv & {
  // alpha 0-1
  a: number;
};

export type Point = { x: number; y: number };

export type NavType = 'colors' | 'custom';

export type NavTab<Type> = { type: Type; name: string };

export type ModeType = 'normal' | `${ColorScheme}`;

export type ModeTab<Type> = NavTab<Type> & { hsva: Hsva };

export type ModeRgba = { type: ModeType; rgba: Rgba };

export type PickColorType = 'palette' | ModeType;

export type PickColorEvent =
  | { type: 'start' | 'end' }
  | { type: 'pick'; detail: Palette };
