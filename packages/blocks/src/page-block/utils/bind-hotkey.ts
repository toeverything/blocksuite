import { Store } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__';
import { createLink } from '../../__internal__/rich-text/link-node';
import { handleFormat } from './container-operations';
const { UNDO, REDO, INLINE_CODE, STRIKE, LINK } = HOTKEYS;

export function bindCommonHotkey(store: Store, scope: string) {
  hotkey.addListener(INLINE_CODE, e => handleFormat(store, e, 'code'), scope);
  hotkey.addListener(STRIKE, e => handleFormat(store, e, 'strike'), scope);
  hotkey.addListener(
    LINK,
    e => {
      hotkey.disabledHotkey();
      e.preventDefault();
      createLink(store, e);
    },
    scope
  );
  hotkey.addListener(UNDO, () => store.undo(), scope);
  hotkey.addListener(REDO, () => store.redo(), scope);
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey(scope: string) {
  hotkey.removeListener([UNDO, REDO, INLINE_CODE, STRIKE, LINK], scope);
}
