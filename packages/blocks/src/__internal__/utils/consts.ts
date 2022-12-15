export const BLOCK_ID_ATTR = 'data-block-id' as const;
export const PREVENT_DEFAULT = false;
export const ALLOW_DEFAULT = true;

export const HOTKEYS = {
  UNDO: 'command+z,ctrl+z',
  REDO: 'command+shift+z,ctrl+shift+z,ctrl+y',
  BACKSPACE: 'backspace',
  SELECT_ALL: 'command+a,ctrl+a',
  SHIFT_UP: 'shift+up',
  SHIFT_DOWN: 'shift+down',
  INLINE_CODE: 'command+e,ctrl+e',
  STRIKE: 'command+shift+s,ctrl+shift+s',
  LINK: 'command+k,ctrl+k',
  TEXT: 'command+option+0,ctrl+shift+0',
  H1: 'command+option+1,ctrl+shift+1',
  H2: 'command+option+2,ctrl+shift+2',
  H3: 'command+option+3,ctrl+shift+3',
  H4: 'command+option+4,ctrl+shift+4',
  H5: 'command+option+5,ctrl+shift+5',
  H6: 'command+option+6,ctrl+shift+6',
  BULLETED: 'command+option+8,ctrl+shift+8',
  NUMBERED_LIST: 'command+option+9,ctrl+shift+9',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  ENTER: 'enter',
};
