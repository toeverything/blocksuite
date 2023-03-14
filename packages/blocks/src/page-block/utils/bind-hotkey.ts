import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import {
  assertEquals,
  assertExists,
  matchFlavours,
} from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import {
  focusBlockByModel,
  hotkey,
  isPageMode,
} from '../../__internal__/index.js';
import { handleMultiBlockIndent } from '../../__internal__/rich-text/rich-text-operations.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { isAtLineEdge } from '../../__internal__/utils/check-line.js';
import {
  asyncFocusRichText,
  focusNextBlock,
  focusPreviousBlock,
  focusTitle,
  getCurrentNativeRange,
  getDefaultPageBlock,
  getModelByElement,
  getPreviousBlock,
  getRichTextByModel,
  Point,
} from '../../__internal__/utils/index.js';
import type { DefaultSelectionManager } from '../default/selection-manager/index.js';
import { handleSelectAll } from '../utils/index.js';
import { formatConfig } from './const.js';
import {
  deleteModelsByRange,
  updateBlockType,
} from './container-operations.js';

export function bindCommonHotkey(page: Page) {
  if (page.readonly) return;

  formatConfig.forEach(({ hotkey: hotkeyStr, action }) => {
    hotkey.addListener(hotkeyStr, e => {
      // Prevent default behavior
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
      const blockRange = getCurrentBlockRange(page);
      if (!blockRange) {
        return;
      }
      updateBlockType(blockRange.models, flavour, type);
    });
  });

  hotkey.addListener(HOTKEYS.UNDO, e => {
    if (page.canUndo) clearSelection(page);
    page.undo();
  });

  hotkey.addListener(HOTKEYS.REDO, e => {
    if (page.canRedo) clearSelection(page);
    page.redo();
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
  ]);
}

export function handleUp(
  e: KeyboardEvent,
  page: Page,
  selection?: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) {
    return;
  }
  if (blockRange.type === 'Block') {
    if (!selection) {
      console.error(
        'Failed to handle up: selection is not provided',
        blockRange
      );
      return;
    }
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const pageBlock = getDefaultPageBlock(selectedModel);
    selection.clear();
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
      focusPreviousBlock(model, new Point(rect.left, rect.top));
      return;
    }
    focusPreviousBlock(model, new Point(left, top));
    return;
  }
}

export function handleDown(
  e: KeyboardEvent,
  page: Page,
  selection?: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) {
    return;
  }
  if (blockRange.type === 'Block' && selection) {
    if (!selection) {
      console.error(
        'Failed to handle down: selection is not provided',
        blockRange
      );
      return;
    }
    const { state } = selection;
    const lastEle = state.selectedBlocks.at(-1);
    if (!lastEle) {
      throw new Error(
        "Failed to handleDown! Can't find last selected element!"
      );
    }
    const selectedModel = getModelByElement(lastEle);
    selection.clear();
    const page = getDefaultPageBlock(selectedModel);
    focusNextBlock(
      selectedModel,
      page.lastSelectionPosition instanceof Point
        ? page.lastSelectionPosition
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
      matchFlavours(model, ['affine:code'] as const) ||
      matchFlavours(model, ['affine:page'] as const)
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
      focusNextBlock(model, new Point(richTextRect.left, richTextRect.top));
      return;
    }
    focusNextBlock(model, new Point(left, bottom));
    return;
  }
  return;
}

function handleTab(
  e: KeyboardEvent,
  page: Page,
  selection: DefaultSelectionManager
) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) {
    return;
  }
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

export function bindHotkeys(page: Page, selection: DefaultSelectionManager) {
  const {
    BACKSPACE,
    SELECT_ALL,

    SHIFT_UP,
    SHIFT_DOWN,

    UP,
    DOWN,
    LEFT,
    RIGHT,
    ENTER,
    TAB,
    SPACE,
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
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Block') {
      const endModel = blockRange.models[blockRange.models.length - 1];
      const parentModel = page.getParent(endModel);
      const index = parentModel?.children.indexOf(endModel);
      assertExists(index);
      assertExists(parentModel);
      const id = page.addBlockByFlavour(
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
    focusBlockByModel(endModel, 'start');
    return;
  });

  hotkey.addListener(BACKSPACE, e => {
    // delete blocks
    deleteModelsByRange(page);
    e.preventDefault();
    return;
  });

  hotkey.addListener(UP, e => {
    handleUp(e, page, selection);
  });
  hotkey.addListener(DOWN, e => {
    handleDown(e, page, selection);
  });
  hotkey.addListener(LEFT, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Block') {
      // Do nothing
      return;
    }
    // Assume native selection is collapsed
    if (blockRange.models.length > 1) {
      throw new Error(
        "Failed to handle arrow left! Native selection can't be multi-block!"
      );
    }
    focusPreviousBlock(blockRange.models[0], 'end');
    return;
  });
  hotkey.addListener(RIGHT, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Block') {
      // Do nothing
      return;
    }
    // Assume native selection is collapsed
    if (blockRange.models.length > 1) {
      throw new Error(
        "Failed to handle arrow right! Native selection can't be multi-block!"
      );
    }
    focusNextBlock(blockRange.models[0], 'start');
    return;
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

  // !!!
  // Don't forget to remove hotkeys at `removeHotkeys`
}

function clearSelection(page: Page) {
  if (!page.root) return;
  const defaultPageBlock = getDefaultPageBlock(page.root);

  if ('selection' in defaultPageBlock) {
    // this is not EdgelessPageBlockComponent
    defaultPageBlock.selection.clear();
  }
}
export function removeHotkeys() {
  removeCommonHotKey();
  hotkey.removeListener([
    HOTKEYS.BACKSPACE,
    HOTKEYS.SELECT_ALL,

    HOTKEYS.SHIFT_UP,
    HOTKEYS.SHIFT_DOWN,

    HOTKEYS.UP,
    HOTKEYS.DOWN,
    HOTKEYS.LEFT,
    HOTKEYS.RIGHT,
    HOTKEYS.ENTER,
    HOTKEYS.TAB,
  ]);
}
