import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import {
  assertEquals,
  assertExists,
  matchFlavours,
} from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import {
  type BlockComponentElement,
  blockRangeToNativeRange,
  focusBlockByModel,
  focusRichText,
  getBlockElementByModel,
  getDefaultPage,
  hotkey,
  isMultiBlockRange,
  isPageMode,
  isPrintableKeyEvent,
} from '../../__internal__/index.js';
import {
  handleMultiBlockIndent,
  handleMultiBlockUnindent,
} from '../../__internal__/rich-text/rich-text-operations.js';
import { getService } from '../../__internal__/service.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { isAtLineEdge } from '../../__internal__/utils/check-line.js';
import {
  asyncFocusRichText,
  clearSelection,
  focusNextBlock,
  focusPreviousBlock,
  focusTitle,
  getCurrentNativeRange,
  getModelByElement,
  getPreviousBlock,
  getRichTextByModel,
  getVirgoByModel,
  Point,
} from '../../__internal__/utils/index.js';
import type { DefaultSelectionManager } from '../default/selection-manager/index.js';
import {
  handleKeydownAfterSelectBlocks,
  handleSelectAll,
} from '../utils/index.js';
import { actionConfig } from './const.js';
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

  actionConfig.forEach(({ hotkey: hotkeyStr, action, enabledWhen }) => {
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
    if (page.canUndo) clearSelection(page);
    page.undo();
  });

  hotkey.addListener(HOTKEYS.REDO, e => {
    e.preventDefault();
    if (page.canRedo) clearSelection(page);
    page.redo();
  });

  // Fixes: https://github.com/toeverything/blocksuite/issues/200
  // We shouldn't prevent user input, because there could have CN/JP/KR... input,
  // that have pop-up for selecting local characters.
  // So we could just hook on the keydown event and detect whether user input a new character.
  hotkey.addListener(HOTKEYS.ANY_KEY, e => {
    if (!isPrintableKeyEvent(e) || page.readonly) return;

    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    if (blockRange.type === 'Block') {
      handleKeydownAfterSelectBlocks({
        page,
        keyboardEvent: e,
        selectedBlocks: blockRange.models,
      });
      return;
    }

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
  {
    selection,
    zoom,
  }: { selection?: DefaultSelectionManager; zoom?: number } = {
    zoom: 1,
  }
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  if (blockRange.type === 'Block') {
    if (!selection) {
      console.error(
        'Failed to handle up: selection is not provided',
        blockRange
      );
      return;
    }
    const selectedModel = getModelByElement(selection.state.selectedBlocks[0]);
    selection.clear();
    const pageBlock = getDefaultPage(page);
    assertExists(pageBlock);
    focusPreviousBlock(
      selectedModel,
      pageBlock.lastSelectionPosition instanceof Point
        ? pageBlock.lastSelectionPosition
        : 'end'
    );
    e.preventDefault();
    return;
  }
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
  {
    selection,
    zoom,
  }: { selection?: DefaultSelectionManager; zoom?: number } = {
    zoom: 1,
  }
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  if (blockRange.type === 'Block') {
    if (!selection) {
      console.error(
        'Failed to handle down: selection is not provided',
        blockRange
      );
      return;
    }
    const lastEle = selection.state.selectedBlocks.at(-1);
    if (!lastEle) {
      throw new Error(
        "Failed to handleDown! Can't find last selected element!"
      );
    }
    const selectedModel = getModelByElement(lastEle);
    selection.clear();
    const pageBlock = getDefaultPage(page);
    assertExists(pageBlock);
    focusNextBlock(
      selectedModel,
      pageBlock.lastSelectionPosition instanceof Point
        ? pageBlock.lastSelectionPosition
        : 'start'
    );
    e.preventDefault();
  }
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

function handleTab(
  e: KeyboardEvent,
  page: Page,
  selection: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  e.preventDefault();
  const models = blockRange.models;
  handleMultiBlockIndent(page, models);

  if (blockRange.type === 'Block') {
    requestAnimationFrame(() => {
      // TODO update model is not elegant
      selection.refreshSelectedBlocksRectsByModels(models);
    });
  }
}

function handleShiftTab(
  e: KeyboardEvent,
  page: Page,
  selection: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;

  const models = blockRange.models;
  handleMultiBlockUnindent(page, models);

  if (blockRange.type === 'Block') {
    requestAnimationFrame(() => {
      selection.refreshSelectedBlocksRectsByModels(models);
    });
  }
}

function handleEscape(
  e: KeyboardEvent,
  page: Page,
  selection: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;
  // Get the current range block models
  const blockModels = blockRange.models;
  assertExists(blockModels);
  // If the selection type is block
  // Clear the selection and foucs the last text block
  if (selection.state.type === 'block') {
    // TODO: need to confirm
    // How many types of text blocks are there?
    const textFlavours = [
      'affine:paragraph',
      'affine:code',
      'affine:quote',
      'affine:list',
    ];

    const lastTextIndex = blockModels.findLastIndex(blockModel =>
      matchFlavours(blockModel, textFlavours)
    );
    let lastTextBlockModel;
    if (lastTextIndex !== -1) {
      // If there is a text block in current range, set it as the last text block
      lastTextBlockModel = blockModels[lastTextIndex];
    } else {
      // TODO: need to confirm
      // Should focus on which block if there is no text block in current range?
      const lastBlockModel = blockModels.at(-1);
      assertExists(lastBlockModel);
      // To find the nearest text block from next siblings
      const nextSiblings = lastBlockModel.page.getNextSiblings(lastBlockModel);
      lastTextBlockModel = nextSiblings.find(blockModel =>
        matchFlavours(blockModel, textFlavours)
      );
      // If no text block in next siblings, find it from previous siblings
      if (!lastTextBlockModel) {
        const previousSiblings =
          lastBlockModel.page.getPreviousSiblings(lastBlockModel);
        lastTextBlockModel = previousSiblings.findLast(blockModel =>
          matchFlavours(blockModel, textFlavours)
        );
      }
    }

    selection.clear();
    selection.state.type = 'native';

    assertExists(lastTextBlockModel);
    const lastTextBlockElement = getBlockElementByModel(lastTextBlockModel);
    focusRichText(lastTextBlockElement as Element, 'end');
  } else if (
    selection.state.type === 'native' ||
    selection.state.type === 'none'
  ) {
    // If the selection type is native or none
    // Select the current range blocks
    const blockElements = blockModels.map(blockModel =>
      getBlockElementByModel(blockModel)
    );
    // Clear the selection
    // To make sure clear the highlight when select multiple blocks
    selection.clear();
    selection.state.blur();
    selection.state.type = 'block';
    selection.setSelectedBlocks(blockElements as BlockComponentElement[]);
  }

  e.stopPropagation();
}

export function bindHotkeys(page: Page, selection: DefaultSelectionManager) {
  const {
    BACKSPACE,
    SELECT_ALL,

    SHIFT_UP,
    SHIFT_DOWN,
    SHIFT_TAB,

    UP,
    DOWN,
    LEFT,
    RIGHT,
    ENTER,
    TAB,
    SPACE,
    DELETE,
    ESC,
  } = HOTKEYS;

  bindCommonHotkey(page);

  hotkey.addListener(SELECT_ALL, e => {
    e.preventDefault();
    handleSelectAll(selection);
    selection.state.type = 'block';
  });

  if (page.readonly) return;

  hotkey.addListener(ENTER, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    if (blockRange.type === 'Block') {
      e.preventDefault();

      const endModel = blockRange.models[blockRange.models.length - 1];
      const parentModel = page.getParent(endModel);
      const index = parentModel?.children.indexOf(endModel);
      assertExists(index);
      assertExists(parentModel);
      const id = page.addBlock(
        'affine:paragraph',
        { type: 'text' },
        parentModel,
        index + 1
      );

      asyncFocusRichText(page, id);
      selection.clear();
      return;
    }
    // Native selection
    // Avoid print extra enter
    e.preventDefault();
    const startModel = blockRange.models[0];
    startModel.text?.delete(
      blockRange.startOffset,
      startModel.text.length - blockRange.startOffset
    );
    const endModel = blockRange.models[blockRange.models.length - 1];
    endModel.text?.delete(0, blockRange.endOffset);
    blockRange.models.slice(1, -1).forEach(model => {
      page.deleteBlock(model);
    });

    // Virgo will addRange after update finished so we need to wait for it.
    const vEditor = getVirgoByModel(endModel);
    vEditor?.slots.updated.once(() => {
      focusBlockByModel(endModel, 'start');
    });
  });

  hotkey.addListener(BACKSPACE, e => {
    // delete blocks
    deleteModelsByRange(page);
    e.preventDefault();
  });

  hotkey.addListener(DELETE, e => {
    // delete blocks
    deleteModelsByRange(page);
    e.preventDefault();
  });

  hotkey.addListener(UP, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    const parent = page.getParent(blockRange.models[0]);
    if (parent && matchFlavours(parent, ['affine:database'])) {
      const service = getService('affine:database');
      if (service.getSelection()) return;
    }
    handleUp(e, page, { selection });
  });
  hotkey.addListener(DOWN, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    const parent = page.getParent(blockRange.models[0]);
    if (parent && matchFlavours(parent, ['affine:database'])) {
      const service = getService('affine:database');
      if (service.getSelection()) return;
    }
    handleDown(e, page, { selection });
  });
  hotkey.addListener(LEFT, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    // Do nothing
    if (blockRange.type === 'Block') return;
    // See https://github.com/toeverything/blocksuite/issues/2260
    if (blockRange.models.length > 1) {
      e.preventDefault();
      const selection = getSelection();
      if (selection) {
        const range = blockRange.nativeRange.cloneRange();
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
    focusPreviousBlock(blockRange.models[0], 'end');
  });
  hotkey.addListener(RIGHT, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) return;

    if (matchFlavours(blockRange.models[0], ['affine:database'])) {
      const service = getService('affine:database');
      if (service.getSelection()) return;
    }
    // Do nothing
    if (blockRange.type === 'Block') return;
    // See https://github.com/toeverything/blocksuite/issues/2260
    if (blockRange.models.length > 1) {
      e.preventDefault();
      const selection = getSelection();
      if (selection) {
        const range = blockRange.nativeRange.cloneRange();
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
    focusNextBlock(blockRange.models[0], 'start');
  });

  hotkey.addListener(TAB, e => handleTab(e, page, selection));

  hotkey.addListener(SHIFT_UP, e => {
    // TODO expand selection up
  });
  hotkey.addListener(SHIFT_DOWN, e => {
    // TODO expand selection down
  });
  // disable it on block selection
  hotkey.addListener(SPACE, e => {
    if (selection.state.type === 'block') {
      e.preventDefault();
    }
  });

  hotkey.addListener(ESC, e => {
    e.preventDefault();
    handleEscape(e, page, selection);
  });

  hotkey.addListener(SHIFT_TAB, e => {
    e.preventDefault();
    handleShiftTab(e, page, selection);
  });

  // !!!
  // Don't forget to remove hotkeys at `removeHotkeys`
}

export function removeHotkeys() {
  removeCommonHotKey();
  hotkey.removeListener([
    HOTKEYS.BACKSPACE,
    HOTKEYS.DELETE,
    HOTKEYS.SELECT_ALL,

    HOTKEYS.SHIFT_UP,
    HOTKEYS.SHIFT_DOWN,
    HOTKEYS.SHIFT_TAB,

    HOTKEYS.UP,
    HOTKEYS.DOWN,
    HOTKEYS.LEFT,
    HOTKEYS.RIGHT,
    HOTKEYS.ENTER,
    HOTKEYS.TAB,
    HOTKEYS.SPACE,
    HOTKEYS.ESC,
  ]);
}
