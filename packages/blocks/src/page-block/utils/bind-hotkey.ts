import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  getBlockElementByModel,
  hasNativeSelection,
  hotkey,
} from '../../__internal__/index.js';
import { handleMultiBlockIndent } from '../../__internal__/rich-text/rich-text-operations.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { isAtLineEdge } from '../../__internal__/utils/check-line.js';
import {
  asyncFocusRichText,
  BlockComponentElement,
  focusNextBlock,
  focusPreviousBlock,
  focusTitle,
  getCurrentNativeRange,
  getDefaultPageBlock,
  getModelByElement,
  getPreviousBlock,
  getRichTextByModel,
  getStartModelBySelection,
  Point,
} from '../../__internal__/utils/index.js';
import type { DefaultPageSignals } from '../default/default-page-block.js';
import type { DefaultSelectionManager } from '../default/selection-manager.js';
import {
  handleBlockSelectionBatchDelete,
  handleMultiBlockBackspace,
  handleSelectAll,
} from '../utils/index.js';
import { formatConfig } from './const.js';
import { updateBlockType } from './container-operations.js';

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
      const blockRange = getCurrentBlockRange(page);
      if (!blockRange) {
        return;
      }
      const models =
        blockRange.startModel === blockRange.endModel
          ? [blockRange.startModel]
          : [
              blockRange.startModel,
              ...blockRange.betweenModels,
              blockRange.endModel,
            ];
      updateBlockType(models, flavour, type);
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
  selection?: DefaultSelectionManager
) {
  // Assume the native selection is collapsed
  if (hasNativeSelection()) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    const previousBlock = getPreviousBlock(model);
    const range = getCurrentNativeRange();
    const { left, top } = range.getBoundingClientRect();
    if (!previousBlock) {
      focusTitle();
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
  if (selection) {
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const page = getDefaultPageBlock(selectedModel);
    selection.clear();
    focusPreviousBlock(
      selectedModel,
      page.lastSelectionPosition instanceof Point
        ? page.lastSelectionPosition
        : 'end'
    );
    e.preventDefault();
  }
}

export function handleDown(
  e: KeyboardEvent,
  selection?: DefaultSelectionManager
) {
  // Assume the native selection is collapsed
  if (hasNativeSelection()) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    if (matchFlavours(model, ['affine:code'])) {
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
  if (selection) {
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
  return;
}

function handleTab(page: Page, selection: DefaultSelectionManager) {
  switch (selection.state.type) {
    case 'native': {
      const range = getCurrentNativeRange();
      const start = range.startContainer;
      const end = range.endContainer;
      const startModel = getModelByElement(start.parentElement as HTMLElement);
      const endModel = getModelByElement(end.parentElement as HTMLElement);
      if (startModel && endModel) {
        let currentModel: BaseBlockModel | null = startModel;
        const models: BaseBlockModel[] = [];
        while (currentModel) {
          const next = page.getNextSibling(currentModel);
          models.push(currentModel);
          if (currentModel.id === endModel.id) {
            break;
          }
          currentModel = next;
        }
        handleMultiBlockIndent(page, models);
      }
      break;
    }
    case 'block': {
      const models = selection.state.selectedBlocks.map(block =>
        getModelByElement(block)
      );
      handleMultiBlockIndent(page, models);

      requestAnimationFrame(() => {
        selection.state.type = 'block';
        // get fresh elements
        selection.state.selectedBlocks = models
          .map(model => getBlockElementByModel(model))
          .filter(block => block !== null) as BlockComponentElement[];
        selection.refreshSelectedBlocksRects();
      });
      selection.clear();
      break;
    }
  }
}

export function bindHotkeys(
  page: Page,
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals
) {
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

  hotkey.addListener(ENTER, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Block') {
      e.stopPropagation();
      e.preventDefault();
      const model = blockRange.endModel;
      const parentModel = page.getParent(model);
      const index = parentModel?.children.indexOf(model);
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
    // TODO fix native selection enter
    return;
  });

  hotkey.addListener(BACKSPACE, e => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Native') {
      handleMultiBlockBackspace(page, e);
      return;
    }

    const models =
      blockRange.startModel === blockRange.endModel
        ? [blockRange.startModel]
        : [
            blockRange.startModel,
            ...blockRange.betweenModels,
            blockRange.endModel,
          ];
    // delete blocks
    handleBlockSelectionBatchDelete(page, models);
    selection.clear();
    e.preventDefault();
    return;
  });

  hotkey.addListener(SELECT_ALL, e => {
    e.preventDefault();
    handleSelectAll(selection);
    selection.state.type = 'block';
  });

  hotkey.addListener(UP, e => {
    handleUp(e, selection);
  });
  hotkey.addListener(DOWN, e => {
    handleDown(e, selection);
  });
  hotkey.addListener(LEFT, e => {
    let model: BaseBlockModel | null = null;
    const {
      state: { selectedBlocks, type },
    } = selection;
    if (
      selectedBlocks.length &&
      !(type === 'native' && window.getSelection()?.rangeCount)
    ) {
      model = getModelByElement(selection.state.selectedBlocks[0]);
      signals.updateSelectedRects.emit([]);
      selection.state.clear();
      e.preventDefault();
    } else {
      const range = window.getSelection()?.getRangeAt(0);
      if (range && range.collapsed && range.startOffset === 0) {
        model = getStartModelBySelection();
      }
    }
    model && focusPreviousBlock(model, 'end');
  });
  hotkey.addListener(RIGHT, e => {
    let model: BaseBlockModel | null = null;
    const {
      state: { selectedBlocks, type },
    } = selection;
    if (
      selectedBlocks.length &&
      !(type === 'native' && window.getSelection()?.rangeCount)
    ) {
      model = getModelByElement(
        selection.state.selectedBlocks[
          selection.state.selectedBlocks.length - 1
        ]
      );
      signals.updateSelectedRects.emit([]);
      selection.state.clear();
      e.preventDefault();
    } else {
      const range = window.getSelection()?.getRangeAt(0);
      const textModel = getStartModelBySelection();
      if (
        range &&
        range.collapsed &&
        range.startOffset === textModel.text?.length
      ) {
        // handleUp(this.selection, this.signals);
        model = getStartModelBySelection();
      }
    }
    model && focusNextBlock(model, 'start');
  });

  hotkey.addListener(TAB, () => handleTab(page, selection));

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
