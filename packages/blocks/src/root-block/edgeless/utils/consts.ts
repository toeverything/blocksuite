import { DEFAULT_ROUGHNESS, StrokeStyle } from '@blocksuite/affine-model';

import { LineWidth } from '../../../_common/types.js';

export const BOOKMARK_MIN_WIDTH = 450;

export const NOTE_MIN_WIDTH = BOOKMARK_MIN_WIDTH + 24 * 2;
export const NOTE_MIN_HEIGHT = 78;
export const NOTE_INIT_HEIGHT = 91;

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
  strokeStyle: StrokeStyle.Solid,
  strokeLineDash: [] as number[],
  stroke: 'black',
  strokeWidth: LineWidth.Two,
  fill: 'transparent',
};

export const DEFAULT_NOTE_CHILD_FLAVOUR = 'affine:paragraph';
export const DEFAULT_NOTE_CHILD_TYPE = 'text';
export const DEFAULT_NOTE_TIP = 'Text';

export const FIT_TO_SCREEN_PADDING = 100;

export const ATTACHED_DISTANCE = 20;

export const EXCLUDING_MOUSE_OUT_CLASS_LIST = [
  'affine-note-mask',
  'edgeless-block-portal-note',
  'affine-block-children-container',
];

export const SurfaceColor = '#6046FE';
export const NoteColor = '#1E96EB';
export const BlendColor = '#7D91FF';

export const SHAPE_TEXT_COLOR_PURE_WHITE = '--affine-palette-line-white';
export const SHAPE_TEXT_COLOR_PURE_BLACK = '--affine-palette-line-black';
export const SHAPE_FILL_COLOR_BLACK = '--affine-palette-shape-black';

export const AI_CHAT_BLOCK_MIN_WIDTH = 260;
export const AI_CHAT_BLOCK_MIN_HEIGHT = 160;
export const AI_CHAT_BLOCK_MAX_WIDTH = 320;
export const AI_CHAT_BLOCK_MAX_HEIGHT = 300;
