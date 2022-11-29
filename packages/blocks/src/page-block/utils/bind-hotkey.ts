import type { Space } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__';
import { createLink } from '../../__internal__/rich-text/link-node';
import { handleFormat } from './container-operations';
const { UNDO, REDO, INLINE_CODE, STRIKE, LINK } = HOTKEYS;

export function bindCommonHotkey(space: Space) {
  hotkey.addListener(INLINE_CODE, e => handleFormat(space, e, 'code'));
  hotkey.addListener(STRIKE, e => handleFormat(space, e, 'strike'));
  hotkey.addListener(LINK, e => {
    e.preventDefault();
    hotkey.withDisabledHotkey(async () => createLink(space, e));
  });
  hotkey.addListener(UNDO, () => space.undo());
  hotkey.addListener(REDO, () => space.redo());
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey() {
  hotkey.removeListener([UNDO, REDO, INLINE_CODE, STRIKE, LINK]);
}
