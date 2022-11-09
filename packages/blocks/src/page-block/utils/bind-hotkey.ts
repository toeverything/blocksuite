import type { Space } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__';
import { createLink } from '../../__internal__/rich-text/link-node';
import { handleFormat } from './container-operations';
const { UNDO, REDO, INLINE_CODE, STRIKE, LINK } = HOTKEYS;

export function bindCommonHotkey(space: Space) {
  hotkey.addListener(INLINE_CODE, e => {
    // workaround page title
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    handleFormat(space, 'code');
  });
  hotkey.addListener(STRIKE, e => {
    // workaround page title
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    handleFormat(space, 'strike');
  });
  hotkey.addListener(LINK, e => {
    // Prevent conflict with browser's search hotkey at windows
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    createLink(space);
  });
  hotkey.addListener(UNDO, () => space.undo());
  hotkey.addListener(REDO, () => space.redo());
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey() {
  hotkey.removeListener([UNDO, REDO, INLINE_CODE, STRIKE, LINK]);
}
