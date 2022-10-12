export const BLOCK_ID_ATTR = 'data-block-id' as const;

/** default hot keys for macOS */
export const DefaultHotkeyMap = {
  selectAll: 'command+a,ctrl+a',
  newPage: 'command+n',
  undo: 'command+z,ctrl+z',
  redo: 'command+shift+z,ctrl+shift+z',
  remove: 'backspace',
  checkUncheck: 'esc',
  preExpendSelect: 'shift+up',
  nextExpendSelect: 'shift+down',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  enter: 'enter',
  code: 'command+e,ctrl+e',
  strikethrough: 'command+shift+s,ctrl+shift+s',
};

export const PREVENT_DEFAULT = false;
export const ALLOW_DEFAULT = true;
