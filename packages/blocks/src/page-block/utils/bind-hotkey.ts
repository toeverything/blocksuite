import { formatConfig } from './const.js';
import type { Page } from '@blocksuite/store';
import { hotkey } from '../../__internal__/index.js';
import { updateSelectedTextType } from './container-operations.js';
import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';

const { UNDO, REDO } = HOTKEYS;

export function bindCommonHotkey(page: Page) {
  formatConfig.forEach(({ hotkey: hotkeyStr, action }) => {
    hotkey.addListener(hotkeyStr, e => {
      // Prevent quill default behavior
      e.preventDefault();
      if (page.awarenessStore.isReadonly(page)) {
        return;
      }

      action({ page });
    });
  });

  paragraphConfig.forEach(({ flavour, type, hotkey: hotkeyStr }) => {
    if (!hotkeyStr) {
      return;
    }
    hotkey.addListener(hotkeyStr, () => {
      updateSelectedTextType(flavour, type);
    });
  });

  hotkey.addListener(UNDO, e => {
    page.undo();
  });
  hotkey.addListener(REDO, e => {
    page.redo();
  });
  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeCommonHotKey() {
  hotkey.removeListener([
    ...formatConfig.map(({ hotkey: hotkeyStr }) => hotkeyStr),
    ...paragraphConfig
      .map(({ hotkey: hotkeyStr }) => hotkeyStr)
      .filter((i): i is string => !!i),
    UNDO,
    REDO,
  ]);
}
