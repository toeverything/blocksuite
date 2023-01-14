import { formatConfig, paragraphConfig } from './const.js';
import type { Page } from '@blocksuite/store';
import { hotkey, HOTKEYS, isPageTitle } from '../../__internal__/index.js';
import { updateSelectedTextType } from './container-operations.js';

const { UNDO, REDO } = HOTKEYS;

export function bindCommonHotkey(page: Page) {
  formatConfig.forEach(({ hotkey: hotkeyStr, action }) => {
    hotkey.addListener(hotkeyStr, e => {
      // workaround page title
      e.preventDefault();
      // TODO also disable hotkey when focus on other input
      if (e.target instanceof HTMLTextAreaElement) return;
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
    if (isPageTitle(e)) {
      e.preventDefault();
    }
    page.undo();
  });
  hotkey.addListener(REDO, e => {
    if (isPageTitle(e)) {
      e.preventDefault();
    }
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
