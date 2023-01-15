import { formatConfig, paragraphConfig } from './const.js';
import type { Page } from '@blocksuite/store';
import { hotkey, HOTKEYS } from '../../__internal__/index.js';
import { updateSelectedTextType } from './container-operations.js';

const { UNDO, REDO } = HOTKEYS;

export function bindCommonHotkey(page: Page) {
  formatConfig.forEach(({ hotkey: hotkeyStr, action }) => {
    hotkey.addListener(hotkeyStr, e => {
      if (page.awareness.isReadonly()) {
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
      updateSelectedTextType(flavour, type, page);
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
