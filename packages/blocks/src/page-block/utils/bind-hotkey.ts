import { HOTKEYS, paragraphConfig } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import { getBlockElementByModel, hotkey } from '../../__internal__/index.js';
import {
  handleMultiBlockIndent,
  isAtLineEdge,
} from '../../__internal__/rich-text/rich-text-operations.js';
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
import type {
  DefaultPageBlockComponent,
  DefaultPageSignals,
} from '../default/default-page-block.js';
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

export function handleUp(
  e: KeyboardEvent,
  selection?: DefaultSelectionManager
) {
  // Assume the native selection is collapsed
  const hasNativeSelection = !!window.getSelection()?.rangeCount;
  if (hasNativeSelection) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    const previousBlock = getPreviousBlock(model);
    const range = getCurrentRange();
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
    selection.clearRects();
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
  const hasNativeSelection = !!window.getSelection()?.rangeCount;
  if (hasNativeSelection) {
    // TODO fix event trigger out of editor
    const model = getStartModelBySelection();
    if (matchFlavours(model, ['affine:code'])) {
      return;
    }
    const range = getCurrentRange();
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
    selection.clearRects();
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
      const range = getCurrentRange();
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
      handleMultiBlockIndent(
        page,
        selection.state.selectedBlocks.map(block => getModelByElement(block))
      );

      const cachedSelectedBlocks = selection.state.selectedBlocks.concat();
      requestAnimationFrame(() => {
        const selectBlocks: DefaultPageBlockComponent[] = [];
        cachedSelectedBlocks.forEach(block => {
          const newBlock = getBlockElementByModel(
            (block as DefaultPageBlockComponent).model
          );
          if (newBlock) {
            selectBlocks.push(newBlock as DefaultPageBlockComponent);
          }
        });
        if (!selectBlocks.length) {
          return;
        }
        selection.state.refreshBlockRectCache();
        selection.setSelectedBlocks(selectBlocks);
      });
      selection.clearRects();

      break;
    }
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
    TAB,
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
    HOTKEYS.TAB,
  ]);
}
