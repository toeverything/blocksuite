import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import { hotkey } from '../../__internal__/index.js';
import { isAtLineEdge } from '../../__internal__/rich-text/rich-text-operations.js';
import {
  asyncFocusRichText,
  focusNextBlock,
  focusPreviousBlock,
  focusTitle,
  getCurrentRange,
  getDefaultPageBlock,
  getModelByElement,
  getPreviousBlock,
  getRichTextByModel,
  getStartModelBySelection,
  isCaptionElement,
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
import { updateSelectedTextType } from './container-operations.js';

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

  hotkey.addListener(HOTKEYS.UNDO, e => {
    page.undo();
  });

  hotkey.addListener(HOTKEYS.REDO, e => {
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

function handleUp(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals,
  e: KeyboardEvent
) {
  // Assume the native selection is collapsed
  const nativeSelection = window.getSelection();
  if (nativeSelection?.anchorNode) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    const previousBlock = getPreviousBlock(model);
    const range = nativeSelection.getRangeAt(0);
    const { left, top } = range.getBoundingClientRect();
    if (!previousBlock) {
      focusTitle();
      return;
    }

    // Workaround select to empty line will get empty range
    // If at empty line range.getBoundingClientRect will return 0
    //
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
  signals.updateSelectedRects.emit([]);
  const { state } = selection;
  const selectedModel = getModelByElement(state.selectedBlocks[0]);
  const page = getDefaultPageBlock(selectedModel);
  e.preventDefault();
  focusPreviousBlock(
    selectedModel,
    page.lastSelectionPosition instanceof Point
      ? page.lastSelectionPosition
      : 'end'
  );
}

function handleDown(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals,
  e: KeyboardEvent
) {
  // Assume the native selection is collapsed
  if (!selection.state.selectedBlocks.length) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    if (matchFlavours(model, ['affine:code'])) {
      return;
    }
    const range = getCurrentRange();
    // We can not focus 'start' directly,
    // because pressing ArrowDown in multi-level indent line will cause the cursor to jump to wrong position
    const atLineEdge = isAtLineEdge(range);
    const { left, bottom } = range.getBoundingClientRect();
    // Workaround select to empty line will get empty range
    // If at empty line `range.getBoundingClientRect()` will return 0
    // https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect
    const isAtEmptyLine = left === 0 && bottom === 0;
    if (atLineEdge || isAtEmptyLine) {
      const richText = getRichTextByModel(model);
      assertExists(richText);
      const richTextRect = richText.getBoundingClientRect();
      focusNextBlock(model, new Point(richTextRect.left, richTextRect.top));
      return;
    }
    focusNextBlock(model, new Point(left, bottom));
    return;
  } else {
    signals.updateSelectedRects.emit([]);
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const page = getDefaultPageBlock(selectedModel);
    e.preventDefault();
    focusNextBlock(
      selectedModel,
      page.lastSelectionPosition instanceof Point
        ? page.lastSelectionPosition
        : 'start'
    );
    return;
  }
}

function isDispatchFromCodeBlock(e: KeyboardEvent) {
  if (!e.target || !(e.target instanceof Element)) {
    return false;
  }
  try {
    // if the target is `body`, it will throw an error
    const model = getModelByElement(e.target);
    return matchFlavours(model, ['affine:code']);
  } catch (error) {
    // just check failed, no need to handle
    return false;
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
  } = HOTKEYS;

  bindCommonHotkey(page);

  hotkey.addListener(ENTER, e => {
    const { type, selectedBlocks } = selection.state;
    const targetInput = e.target;
    // TODO caption ad-hoc should be moved to the caption input for processing
    const isCaption = isCaptionElement(targetInput);
    // select blocks or focus caption input, then enter will create a new block.
    if ((type === 'block' && selectedBlocks.length) || isCaption) {
      e.stopPropagation();
      e.preventDefault();
      const element = isCaption
        ? targetInput
        : selectedBlocks[selectedBlocks.length - 1];
      const model = getModelByElement(element);
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
      selection.state.clear();
      selection.clearRects();
      return;
    }
  });

  hotkey.addListener(BACKSPACE, e => {
    const { state } = selection;
    if (state.type === 'none') {
      // Will be handled in the `keyboard.onBackspace` function
      return;
    }
    if (state.type === 'native') {
      handleMultiBlockBackspace(page, e);
      return;
    }

    if (state.type === 'block') {
      // XXX Ad-hoc for code block
      // At the beginning of the code block,
      // the backspace will selected the block first.
      // The select logic already processed in the `handleLineStartBackspace` function.
      // So we need to prevent the default delete behavior.
      if (isDispatchFromCodeBlock(e)) {
        return;
      }
      const { selectedBlocks } = state;

      // delete selected blocks
      handleBlockSelectionBatchDelete(
        page,
        selectedBlocks.map(block => getModelByElement(block))
      );
      e.preventDefault();
      state.clear();
      signals.updateSelectedRects.emit([]);
      signals.updateEmbedRects.emit([]);
      signals.updateEmbedEditingState.emit(null);
      return;
    }
  });

  hotkey.addListener(SELECT_ALL, e => {
    e.preventDefault();
    handleSelectAll(selection);
    selection.state.type = 'block';
  });

  hotkey.addListener(UP, e => {
    handleUp(selection, signals, e);
  });
  hotkey.addListener(DOWN, e => {
    handleDown(selection, signals, e);
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

  hotkey.addListener(SHIFT_UP, e => {
    // TODO expand selection up
  });
  hotkey.addListener(SHIFT_DOWN, e => {
    // TODO expand selection down
  });

  // !!!
  // Don't forget to remove hotkeys at `removeHotkeys`
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
  ]);
}
