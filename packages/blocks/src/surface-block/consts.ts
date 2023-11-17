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

export const enum CanvasTextFontFamily {
  Inter = 'Inter',
  Kalam = 'Kalam',
  Satoshi = 'Satoshi',
  Poppins = 'Poppins',
  Lora = 'Lora',
  BebasNeue = 'BebasNeue',
  OrelegaOne = 'OrelegaOne',
}

export const enum CanvasTextFontWeight {
  Light = '300',
  Regular = '400',
  SemiBold = '600',
}

export const enum CanvasTextFontStyle {
  Normal = 'normal',
  Italic = 'italic',
}
