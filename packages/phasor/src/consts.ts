export const MIN_ZOOM = 0.3;
export const GRID_SIZE = 3000;

export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
}

export enum StrokeStyle {
  Solid = 'solid',
  Dashed = 'dashed',
}
