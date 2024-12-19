/* eslint perfectionist/sort-enums: "off" */

import { z } from 'zod';

import { createEnumMap } from '../utils/enum.js';

export enum LineWidth {
  Two = 2,
  // Thin
  Four = 4,
  Six = 6,
  Eight = 8,
  // Thick
  Ten = 10,
  Twelve = 12,
}

export const LINE_WIDTHS = [
  LineWidth.Two,
  LineWidth.Four,
  LineWidth.Six,
  LineWidth.Eight,
  LineWidth.Ten,
  LineWidth.Twelve,
];

/**
 * Use `DefaultTheme.StrokeColorMap` instead.
 *
 * @deprecated
 */
export enum LineColor {
  Black = '--affine-palette-line-black',
  Blue = '--affine-palette-line-blue',
  Green = '--affine-palette-line-green',
  Grey = '--affine-palette-line-grey',
  Magenta = '--affine-palette-line-magenta',
  Orange = '--affine-palette-line-orange',
  Purple = '--affine-palette-line-purple',
  Red = '--affine-palette-line-red',
  Teal = '--affine-palette-line-teal',
  White = '--affine-palette-line-white',
  Yellow = '--affine-palette-line-yellow',
}

export const LineColorMap = createEnumMap(LineColor);

export const LINE_COLORS = [
  LineColor.Yellow,
  LineColor.Orange,
  LineColor.Red,
  LineColor.Magenta,
  LineColor.Purple,
  LineColor.Blue,
  LineColor.Teal,
  LineColor.Green,
  LineColor.Black,
  LineColor.Grey,
  LineColor.White,
] as const;

export const LineColorsSchema = z.nativeEnum(LineColor);
