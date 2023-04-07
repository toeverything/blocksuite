export * from './consts/affine-style-consts.js';
export * from './consts/block-hub.js';

export const BLOCK_ID_ATTR = 'data-block-id';
export const BLOCK_SERVICE_LOADING_ATTR = 'data-service-loading';
export const PREVENT_DEFAULT = false;
export type PREVENT_DEFAULT = typeof PREVENT_DEFAULT;
export const ALLOW_DEFAULT = true;
export type ALLOW_DEFAULT = typeof ALLOW_DEFAULT;

export const HOTKEYS = {
  ANY_KEY: '*',
  UNDO: 'command+z,ctrl+z',
  REDO: 'command+shift+z,ctrl+shift+z,ctrl+y',
  BACKSPACE: 'backspace',
  SELECT_ALL: 'command+a,ctrl+a',
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
export const DRAG_HANDLE_OFFSET_LEFT = 1;
