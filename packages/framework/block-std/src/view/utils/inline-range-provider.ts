import { Slot, assertExists } from '@blocksuite/global/utils';
import {
  INLINE_ROOT_ATTR,
  type InlineRange,
  type InlineRangeProvider,
  type InlineRangeUpdatedProp,
} from '@blocksuite/inline';

import type { TextSelection } from '../../selection/index.js';
import type { BlockElement } from '../element/block-element.js';

export const getInlineRangeProvider: (
  element: BlockElement
) => InlineRangeProvider | null = element => {
  const editorHost = element.host;
  const selectionManager = editorHost.selection;
  const rangeManager = editorHost.rangeManager;
  const inlineRangeUpdatedSlot = new Slot<InlineRangeUpdatedProp>();

  if (!selectionManager || !rangeManager) {
    return null;
  }

  const isElementSelected = (range: Range): boolean => {
    // Most cases, the range is collapsed, so we no need to use `intersectsNode`
    // because its performance is not good enough.
    if (range.collapsed) {
      const startElement =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement;
      const inlineRoot = startElement?.closest(`[${INLINE_ROOT_ATTR}]`);
      if (!inlineRoot) return false;

      const blockElement = startElement?.closest(`[${editorHost.blockIdAttr}]`);
      if (!blockElement || blockElement !== element) return false;
    } else {
      if (!range.intersectsNode(element)) return false;
    }
    return true;
  };

  const calculateInlineRange = (
    range: Range,
    textSelection: TextSelection
  ): InlineRange | null => {
    if (!isElementSelected(range)) {
      return null;
    }

    const { from, to } = textSelection;

    if (from.blockId === element.blockId) {
      return {
        index: from.index,
        length: from.length,
      };
    }

    if (to && to.blockId === element.blockId) {
      return {
        index: to.index,
        length: to.length,
      };
    }

    assertExists(element.model.text);
    return {
      index: 0,
      length: element.model.text.length,
    };
  };

  const setInlineRange = (inlineRange: InlineRange | null, sync = true) => {
    // skip `setInlineRange` from `inlineEditor` when composing happens across blocks,
    // selection will be updated in `range-binding`
    if (rangeManager.binding.isComposing) return;

    if (!inlineRange) {
      selectionManager.clear(['text']);
    } else {
      const textSelection = selectionManager.create('text', {
        from: {
          blockId: element.blockId,
          index: inlineRange.index,
          length: inlineRange.length,
        },
        to: null,
      });
      selectionManager.setGroup('note', [textSelection]);
    }

    inlineRangeUpdatedSlot.emit([inlineRange, sync]);
  };

  const getInlineRange = (): InlineRange | null => {
    const sl = document.getSelection();
    if (!sl || sl.rangeCount === 0) {
      return null;
    }
    const range = sl.getRangeAt(0);
    if (!range) {
      return null;
    }

    const textSelection = selectionManager.find('text');
    if (!textSelection) {
      return null;
    }

    return calculateInlineRange(range, textSelection);
  };

  selectionManager.slots.changed.on(() => {
    const textSelection = selectionManager.find('text');
    if (!textSelection) return;

    const range = rangeManager.value;
    if (!range || !isElementSelected(range)) return;

    // wait for lit updated
    requestAnimationFrame(() => {
      const inlineRange = calculateInlineRange(range, textSelection);
      inlineRangeUpdatedSlot.emit([inlineRange, false]);
    });
  });

  return {
    setInlineRange,
    getInlineRange,
    inlineRangeUpdated: inlineRangeUpdatedSlot,
  };
};
