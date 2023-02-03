export * from './consts/blockhub.js';
export * from './consts/affine-style-consts.js';

export const BLOCK_ID_ATTR = 'data-block-id' as const;
export const BLOCK_SERVICE_LOADING_ATTR = 'data-service-loading' as const;
export const PREVENT_DEFAULT = false;
export const ALLOW_DEFAULT = true;

export const HOTKEYS = {
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
};

export const MOVE_DETECT_THRESHOLD = 2;
export const SCROLL_THRESHOLD = 100;

export const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 26;
