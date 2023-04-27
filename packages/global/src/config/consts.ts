import type { CssVariableName } from '@blocksuite/blocks';

import { SHORT_KEY } from './consts/platform.js';

export * from './consts/block-hub.js';
export * from './consts/platform.js';

export const BLOCK_ID_ATTR = 'data-block-id';
export const BLOCK_SERVICE_LOADING_ATTR = 'data-service-loading';
export const PREVENT_DEFAULT = false;
export type PREVENT_DEFAULT = typeof PREVENT_DEFAULT;
export const ALLOW_DEFAULT = true;
export type ALLOW_DEFAULT = typeof ALLOW_DEFAULT;

export const HOTKEYS = {
  ANY_KEY: '*',
  UNDO: `${SHORT_KEY}+z`,
  REDO: `${SHORT_KEY}+shift+z,ctrl+y`,
  BACKSPACE: 'backspace',
  SELECT_ALL: `${SHORT_KEY}+a`,
  SHIFT_UP: 'shift+up',
  SHIFT_DOWN: 'shift+down',

  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  ENTER: 'enter',
  TAB: 'tab',
  SPACE: 'space',
  ESC: 'esc',
};

export const MOVE_DETECT_THRESHOLD = 2;
export const SCROLL_THRESHOLD = 100;

export const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 26;
export const BLOCK_CHILDREN_CONTAINER_WIDTH = 720 - 24 * 2;
export const DRAG_HANDLE_OFFSET_LEFT = 1;
export const EDGELESS_BLOCK_CHILD_PADDING = 24;

export const FRAME_BACKGROUND_COLORS: CssVariableName[] = [
  '--affine-background-secondary-color',
  '--affine-tag-yellow',
  '--affine-tag-red',
  '--affine-tag-green',
  '--affine-tag-blue',
  '--affine-tag-purple',
];
