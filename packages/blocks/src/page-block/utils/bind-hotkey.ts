import type { Page } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__/index.js';
import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import { handleFormat } from './container-operations.js';
const { UNDO, REDO, INLINE_CODE, STRIKE, LINK } = HOTKEYS;

export function bindCommonHotkey(page: Page) {
  hotkey.addListener(INLINE_CODE, e => {
    // workaround page title
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    handleFormat(page, 'code');
  });
  hotkey.addListener(STRIKE, e => {
    // workaround page title
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    handleFormat(page, 'strike');
  });
  hotkey.addListener(LINK, e => {
    // Prevent conflict with browser's search hotkey at windows
    e.preventDefault();
    if (e.target instanceof HTMLInputElement) return;
    createLink(page);
  });
  hotkey.addListener(UNDO, () => page.undo());
  hotkey.addListener(REDO, () => page.redo());
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey() {
  hotkey.removeListener([UNDO, REDO, INLINE_CODE, STRIKE, LINK]);
}
