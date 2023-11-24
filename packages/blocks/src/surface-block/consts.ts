export const ZOOM_MAX = 6.0;
export const ZOOM_MIN = 0.1;
export const ZOOM_STEP = 0.25;
export const ZOOM_INITIAL = 1.0;
export const GRID_SIZE = 3000;
export const GRID_GAP_MIN = 10;
export const GRID_GAP_MAX = 50;

export const DEFAULT_ROUGHNESS = 1.4;
// TODO: need to check the default central area ratio
export const DEFAULT_CENTRAL_AREA_RATIO = 0.3;

export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
}

export enum ShapeStyle {
  General = 'General',
  Scribbled = 'Scribbled',
}

export enum StrokeStyle {
  Solid = 'solid',
  Dashed = 'dash',
  None = 'none',
}

export interface IModelCoord {
  x: number;
  y: number;
}

export enum CanvasTextFontFamily {
  Inter = 'blocksuite:surface:Inter',
  Kalam = 'blocksuite:surface:Kalam',
  Satoshi = 'blocksuite:surface:Satoshi',
  Poppins = 'blocksuite:surface:Poppins',
  Lora = 'blocksuite:surface:Lora',
  BebasNeue = 'blocksuite:surface:BebasNeue',
  OrelegaOne = 'blocksuite:surface:OrelegaOne',
}
export const CANVAS_TEXT_FONT_FAMILY = Object.values(CanvasTextFontFamily);

export const enum CanvasTextFontWeight {
  Light = '300',
  Regular = '400',
  SemiBold = '600',
}

export const enum CanvasTextFontStyle {
  Normal = 'normal',
  Italic = 'italic',
}
