import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import {
  assertEquals,
  assertExists,
  matchFlavours,
} from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import {
  blockRangeToNativeRange,
  hotkey,
  isMultiBlockRange,
  isPageMode,
  isPrintableKeyEvent,
} from '../../__internal__/index.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { isAtLineEdge } from '../../__internal__/utils/check-line.js';
import {
  focusNextBlock,
  focusPreviousBlock,
  focusTitle,
  getCurrentNativeRange,
  getPreviousBlock,
  getRichTextByModel,
  Point,
} from '../../__internal__/utils/index.js';
// import type { DefaultSelectionManager } from '../default/selection-manager/index.js';
import { legacyActionConfig } from './const.js';
import {
  deleteModelsByRange,
  updateBlockType,
} from './container-operations.js';
import { formatConfig } from './format-config.js';

export function bindCommonHotkey(page: Page) {
  if (page.readonly) return;

  formatConfig.forEach(({ hotkey: hotkeyStr, action }) => {
    hotkey.addListener(hotkeyStr, e => {
      // Prevent default behavior
      e.preventDefault();

      if (page.awarenessStore.isReadonly(page)) return;

      action({ page });
    });
  });

  legacyActionConfig.forEach(({ hotkey: hotkeyStr, action, enabledWhen }) => {
    // if (!isPrintableKeyEvent(e) || page.readonly) return;
    if (!hotkeyStr) return;

    hotkey.addListener(hotkeyStr, e => {
      // Prevent default behavior
      e.preventDefault();

      if (!enabledWhen(page)) return;
      if (page.awarenessStore.isReadonly(page)) return;

      action({ page });
    });
  });

  paragraphConfig.forEach(({ flavour, type, hotkey: hotkeyStr }) => {
    if (!hotkeyStr) return;

    hotkey.addListener(hotkeyStr, () => {
      const blockRange = getCurrentBlockRange(page);
      if (!blockRange) return;

      updateBlockType(blockRange.models, flavour, type);
    });
  });

  hotkey.addListener(HOTKEYS.UNDO, e => {
    e.preventDefault();
    if (page.canUndo) {
      page.undo();
    }
  });

  hotkey.addListener(HOTKEYS.REDO, e => {
    e.preventDefault();
    if (page.canRedo) {
      page.redo();
    }
  });

  // Fixes: https://github.com/toeverything/blocksuite/issues/200
  // We shouldn't prevent user input, because there could have CN/JP/KR... input,
  // that have pop-up for selecting local characters.
  // So we could just hook on the keydown event and detect whether user input a new character.
  hotkey.addListener(HOTKEYS.ANY_KEY, e => {
    if (!isPrintableKeyEvent(e) || page.readonly) return;

    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    const range = blockRangeToNativeRange(blockRange);
    if (!range || !isMultiBlockRange(range)) return;
    deleteModelsByRange(page, blockRange);
  });

  // !!!
  // Don't forget to remove hotkeys at `removeCommonHotKey`
}

export function removeCommonHotKey() {
  hotkey.removeListener([
    ...formatConfig.map(({ hotkey: hotkeyStr }) => hotkeyStr),
    ...paragraphConfig
      .map(({ hotkey: hotkeyStr }) => hotkeyStr)
      .filter((i): i is string => !!i),
    HOTKEYS.UNDO,
    HOTKEYS.REDO,
    HOTKEYS.ANY_KEY,
  ]);
}

export function handleUp(
  e: KeyboardEvent,
  page: Page,
  { zoom }: { zoom?: number } = {
    zoom: 1,
  }
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  // Assume the native selection is collapsed
  if (blockRange.type === 'Native') {
    assertEquals(
      blockRange.models.length,
      1,
      'Failed to handle up! range is not collapsed'
    );
    const model = blockRange.models[0];
    const previousBlock = getPreviousBlock(model);
    const range = getCurrentNativeRange();
    const { left, top } = range.getBoundingClientRect();
    if (!previousBlock && isPageMode(page)) {
      focusTitle(page);
      return;
    }

    // Workaround: focus to empty line will get empty range rect
    //
    // See the following example:
    // - long text
    //   wrap line
    // - |    <- caret at empty line,
    //           if you press ArrowUp,
    //           the cursor should jump to the start of `wrap line`,
    //           instead of the start of `long text`!
    //
    // If at empty line range.getBoundingClientRect will return 0
    // You can see the spec here:
    // The `getBoundingClientRect()` method, when invoked, must return the result of the following algorithm:
    //   - Let list be the result of invoking getClientRects() on the same range this method was invoked on.
    //   - If list is empty return a DOMRect object whose x, y, width and height members are zero.
    // https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect
    if (left === 0 && top === 0) {
      if (!(range.startContainer instanceof HTMLElement)) {
        console.warn(
          "Failed to calculate caret position! range.getBoundingClientRect() is zero and it's startContainer not an HTMLElement.",
          range
        );
        focusPreviousBlock(model);
        return;
      }
      const rect = range.startContainer.getBoundingClientRect();
      focusPreviousBlock(model, new Point(rect.left, rect.top), zoom);
      return;
    }
    focusPreviousBlock(model, new Point(left, top), zoom);
  }
}

export function handleDown(
  e: KeyboardEvent,
  page: Page,
  { zoom }: { zoom?: number } = {
    zoom: 1,
  }
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  // Assume the native selection is collapsed
  if (blockRange.type === 'Native') {
    assertEquals(
      blockRange.models.length,
      1,
      'Failed to handle down! range is not collapsed'
    );
    const model = blockRange.models[0];
    if (
      matchFlavours(model, ['affine:code']) ||
      matchFlavours(model, ['affine:page'])
    ) {
      return;
    }
    const range = getCurrentNativeRange();
    const atLineEdge = isAtLineEdge(range);
    const { left, bottom } = range.getBoundingClientRect();
    const isAtEmptyLine = left === 0 && bottom === 0;
    // Workaround: at line edge will return wrong rect
    // See the following example:
    // - long text
    //   |wrap line    <- caret at empty line,
    //                    if you press ArrowDown,
    //                    the cursor should jump to the start of `next line`,
    //                    instead of the end of `next line`!
    // - next line
    //
    // Workaround: focus to empty line will get empty range,
    // we can not focus 'start' directly,
    // because pressing ArrowDown in multi-level indent line will cause the cursor to jump to wrong position
    // If at empty line `range.getBoundingClientRect()` will return 0
    // https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect
    //
    // See the following example:
    // - text
    //   - child
    //     - |   <- caret at empty line,
    //              if you press ArrowDown,
    //              the cursor should jump to the end of `next`,
    //              instead of the start of `next`!
    // - next
    if (atLineEdge || isAtEmptyLine) {
      const richText = getRichTextByModel(model);
      assertExists(richText);
      const richTextRect = richText.getBoundingClientRect();
      focusNextBlock(
        model,
        new Point(richTextRect.left, richTextRect.top),
        zoom
      );
      return;
    }
    focusNextBlock(model, new Point(left, bottom), zoom);
  }
}
