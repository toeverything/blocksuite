export type StrokeStyle = 'solid' | 'dash' | 'none';

export enum FontFamily {
  Inter = 'blocksuite:surface:Inter',
  Kalam = 'blocksuite:surface:Kalam',
  Satoshi = 'blocksuite:surface:Satoshi',
  Poppins = 'blocksuite:surface:Poppins',
  Lora = 'blocksuite:surface:Lora',
  BebasNeue = 'blocksuite:surface:BebasNeue',
  OrelegaOne = 'blocksuite:surface:OrelegaOne',
}

export enum TextResizing {
  AUTO_WIDTH,
  AUTO_HEIGHT,
  FIXED_SIZE,
}

export const enum FontWeight {
  Light = '300',
  Regular = '400',
  SemiBold = '600',
}

export type FontStyle = 'normal' | 'italic';

export type TextAlign = 'left' | 'center' | 'right';

export type VerticalAlign = 'top' | 'center' | 'bottom';

export const DEFAULT_CENTRAL_AREA_RATIO = 0.3;
