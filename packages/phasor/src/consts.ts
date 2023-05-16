export const ZOOM_MAX = 3.0;
export const ZOOM_MIN = 0.1;
export const ZOOM_STEP = 0.1;
export const GRID_SIZE = 3000;

export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
}

export enum StrokeStyle {
  Solid = 'solid',
  Dashed = 'dash',
  None = 'none',
}
