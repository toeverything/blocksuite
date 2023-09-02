import { DEFAULT_ROUGHNESS } from '../../../surface-block/index.js';

export const NOTE_MIN_WIDTH = 200;
export const NOTE_MIN_HEIGHT = 20;

export const DEFAULT_NOTE_WIDTH = 448;
export const DEFAULT_NOTE_HEIGHT = 72;
export const DEFAULT_NOTE_OFFSET_X = 30;
export const DEFAULT_NOTE_OFFSET_Y = 40;
export const NOTE_OVERLAY_OFFSET_X = 6;
export const NOTE_OVERLAY_OFFSET_Y = 6;
export const NOTE_OVERLAY_WIDTH = 100;
export const NOTE_OVERLAY_HEIGHT = 50;
export const NOTE_OVERLAY_CORNER_RADIUS = 6;
export const NOTE_OVERLAY_STOKE_COLOR = '--affine-border-color';
export const NOTE_OVERLAY_TEXT_COLOR = '--affine-icon-color';
export const NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR = 'rgba(252, 252, 253, 1)';
export const NOTE_OVERLAY_DARK_BACKGROUND_COLOR = 'rgb(32, 32, 32)';

export const SHAPE_OVERLAY_WIDTH = 100;
export const SHAPE_OVERLAY_HEIGHT = 100;
export const SHAPE_OVERLAY_OFFSET_X = 6;
export const SHAPE_OVERLAY_OFFSET_Y = 6;
export const SHAPE_OVERLAY_OPTIONS = {
  seed: 666,
  roughness: DEFAULT_ROUGHNESS,
  strokeLineDash: [0, 0],
  stroke: 'black',
  strokeWidth: 4,
  fill: 'transparent',
};

export const DEFAULT_NOTE_CHILD_FLAVOUR = 'affine:paragraph';
export const DEFAULT_NOTE_CHILD_TYPE = 'text';
export const DEFAULT_NOTE_TIP = 'Text';

export const FIT_TO_SCREEN_PADDING = 100;

export const ATTACHED_DISTANCE = 20;

export const EXCLUDING_MOUSE_OUT_CLASS_LIST = [
  'affine-note-mask',
  'affine-edgeless-child-note',
  'affine-block-children-container',
];

export const SCRIBBLED_CANVAS_FONT_FAMILY = "'Kalam', cursive";
export const GENERAL_CANVAS_FONT_FAMILY = 'sans-serif';

export const SurfaceColor = '#6046FE';
export const NoteColor = '#1E96EB';
export const BlendColor = '#7D91FF';

export const SHAPE_TEXT_COLOR_PURE_WHITE = 'white';
export const SHAPE_TEXT_COLOR_PURE_BLACK = 'black';
export const SHAPE_FILL_COLOR_BLACK = '--affine-palette-shape-black';
