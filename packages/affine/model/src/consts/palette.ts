import { getColorByKey } from './color.js';

export const Transparent = 'transparent';
export const White = getColorByKey('edgeless/palette/white');
export const Black = getColorByKey('edgeless/palette/black');

export const Light = {
  Red: getColorByKey('edgeless/palette/light/redLight'),
  Orange: getColorByKey('edgeless/palette/light/orangeLight'),
  Yellow: getColorByKey('edgeless/palette/light/yellowLight'),
  Green: getColorByKey('edgeless/palette/light/greenLight'),
  Blue: getColorByKey('edgeless/palette/light/blueLight'),
  Purple: getColorByKey('edgeless/palette/light/purpleLight'),
  Magenta: getColorByKey('edgeless/palette/light/magentaLight'),
  Grey: getColorByKey('edgeless/palette/light/greyLight'),
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
  Red: getColorByKey('edgeless/palette/medium/redMedium'),
  Orange: getColorByKey('edgeless/palette/medium/orangeMedium'),
  Yellow: getColorByKey('edgeless/palette/medium/yellowMedium'),
  Green: getColorByKey('edgeless/palette/medium/greenMedium'),
  Blue: getColorByKey('edgeless/palette/medium/blueMedium'),
  Purple: getColorByKey('edgeless/palette/medium/purpleMedium'),
  Magenta: getColorByKey('edgeless/palette/medium/magentaMedium'),
  Grey: getColorByKey('edgeless/palette/medium/greyMedium'),
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
  Red: getColorByKey('edgeless/palette/heavy/red'),
  Orange: getColorByKey('edgeless/palette/heavy/orange'),
  Yellow: getColorByKey('edgeless/palette/heavy/yellow'),
  Green: getColorByKey('edgeless/palette/heavy/green'),
  Blue: getColorByKey('edgeless/palette/heavy/blue'),
  Purple: getColorByKey('edgeless/palette/heavy/purple'),
  Magenta: getColorByKey('edgeless/palette/heavy/magenta'),
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

export const StrokeColor = { Black, White, ...Medium } as const;

export const STROKE_COLORS = [...MEDIUM_PALETTES, Black, White] as const;
