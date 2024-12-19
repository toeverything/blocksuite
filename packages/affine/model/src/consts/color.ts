import { themeToVar } from '@toeverything/theme/v2';
import { z } from 'zod';

import { createEnumMap } from '../utils/enum.js';

export const Transparent = 'transparent';
export const White = themeToVar('edgeless/palette/white');
export const Black = themeToVar('edgeless/palette/black');

export const Light = {
  Red: themeToVar('edgeless/palette/light/redLight'),
  Orange: themeToVar('edgeless/palette/light/orangeLight'),
  Yellow: themeToVar('edgeless/palette/light/yellowLight'),
  Green: themeToVar('edgeless/palette/light/greenLight'),
  Blue: themeToVar('edgeless/palette/light/blueLight'),
  Purple: themeToVar('edgeless/palette/light/purpleLight'),
  Magenta: themeToVar('edgeless/palette/light/magentaLight'),
  Grey: themeToVar('edgeless/palette/light/greyLight'),
} as const;

export const LIGHT_PALETTES = [
  Light.Red,
  Light.Orange,
  Light.Yellow,
  Light.Green,
  Light.Blue,
  Light.Purple,
  Light.Magenta,
  Light.Grey,
] as const;

export const Medium = {
  Red: themeToVar('edgeless/palette/medium/redMedium'),
  Orange: themeToVar('edgeless/palette/medium/orangeMedium'),
  Yellow: themeToVar('edgeless/palette/medium/yellowMedium'),
  Green: themeToVar('edgeless/palette/medium/greenMedium'),
  Blue: themeToVar('edgeless/palette/medium/blueMedium'),
  Purple: themeToVar('edgeless/palette/medium/purpleMedium'),
  Magenta: themeToVar('edgeless/palette/medium/magentaMedium'),
  Grey: themeToVar('edgeless/palette/medium/greyMedium'),
} as const;

export const MEDIUM_PALETTES = [
  Medium.Red,
  Medium.Orange,
  Medium.Yellow,
  Medium.Green,
  Medium.Blue,
  Medium.Purple,
  Medium.Magenta,
  Medium.Grey,
] as const;

export const Heavy = {
  Red: themeToVar('edgeless/palette/heavy/red'),
  Orange: themeToVar('edgeless/palette/heavy/orange'),
  Yellow: themeToVar('edgeless/palette/heavy/yellow'),
  Green: themeToVar('edgeless/palette/heavy/green'),
  Blue: themeToVar('edgeless/palette/heavy/blue'),
  Purple: themeToVar('edgeless/palette/heavy/purple'),
  Magenta: themeToVar('edgeless/palette/heavy/magenta'),
} as const;

export const HEAVY_PALETTES = [
  Heavy.Red,
  Heavy.Orange,
  Heavy.Yellow,
  Heavy.Green,
  Heavy.Blue,
  Heavy.Purple,
  Heavy.Magenta,
] as const;

export const PALETTES = [
  // Light
  ...LIGHT_PALETTES,

  Transparent,

  // Medium
  ...MEDIUM_PALETTES,

  White,

  // Heavy
  ...HEAVY_PALETTES,

  Black,
] as const;

export const PaletteEnum = z.enum(PALETTES);
export type PaletteEnum = z.infer<typeof PaletteEnum>;

export const StrokeColor = { Black, White, ...Medium } as const;

export const StrokeColorMap = createEnumMap(StrokeColor);

export const STROKE_COLORS = [...MEDIUM_PALETTES, Black, White] as const;
