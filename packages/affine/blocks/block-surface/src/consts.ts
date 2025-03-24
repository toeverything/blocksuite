export const ZOOM_MAX = 6.0;
export const ZOOM_MIN = 0.1;
export const ZOOM_STEP = 0.25;
export const ZOOM_INITIAL = 1.0;
export const ZOOM_WHEEL_STEP = 0.1;
export const GRID_SIZE = 3000;
export const GRID_GAP_MIN = 10;
export const GRID_GAP_MAX = 50;
export const DEFAULT_NOTE_OFFSET_X = 30;
export const DEFAULT_NOTE_OFFSET_Y = 40;

// TODO: need to check the default central area ratio
export const DEFAULT_CENTRAL_AREA_RATIO = 0.3;

export interface IModelCoord {
  x: number;
  y: number;
}

export const EXCLUDING_MOUSE_OUT_CLASS_LIST = [
  'affine-note-mask',
  'edgeless-block-portal-note',
  'affine-block-children-container',
];
