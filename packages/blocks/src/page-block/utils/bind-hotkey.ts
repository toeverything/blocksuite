import { Store } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__';
import { createLink } from '../../__internal__/rich-text/link-node';
import { handleFormat } from './container-operations';
const { UNDO, REDO, INLINE_CODE, STRIKE, LINK } = HOTKEYS;

export function bindCommonHotkey(store: Store) {
  hotkey.addListener(INLINE_CODE, e => handleFormat(store, e, 'code'));
  hotkey.addListener(STRIKE, e => handleFormat(store, e, 'strike'));
  hotkey.addListener(LINK, e => {
    hotkey.disabledHotkey();
    e.preventDefault();
    createLink(store, e).then(() => {
      hotkey.enableHotkey();
    });
  });
  hotkey.addListener(UNDO, () => store.undo());
  hotkey.addListener(REDO, () => store.redo());
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey() {
  hotkey.removeListener([UNDO, REDO, INLINE_CODE, STRIKE, LINK]);
}
