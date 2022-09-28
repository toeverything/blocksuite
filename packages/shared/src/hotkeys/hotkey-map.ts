export type HotKeyTypes =
  | 'selectAll'
  | 'newPage'
  | 'undo'
  | 'redo'
  | 'remove'
  | 'checkUncheck'
  | 'preExpendSelect'
  | 'nextExpendSelect'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'enter'
  | 'test';

export type HotkeyMapType = Record<HotKeyTypes, string>;

/** hot key maps for mac */
export const HotkeyMap: HotkeyMapType = {
  selectAll: 'command+a',
  newPage: 'command+n',
  undo: 'command+z',
  redo: 'command+shift+z',
  remove: 'backspace',
  checkUncheck: 'esc',
  preExpendSelect: 'shift+up',
  nextExpendSelect: 'shift+down',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  enter: 'enter',
  test: 'ctrl+n',
};
