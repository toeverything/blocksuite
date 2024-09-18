import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  INLINE_ROOT_ATTR,
  type InlineRange,
  type InlineRangeProvider,
} from '@blocksuite/inline';
import { signal } from '@preact/signals-core';

import type { TextSelection } from '../selection/index.js';
import type { BlockComponent } from '../view/element/block-component.js';

import { BLOCK_ID_ATTR } from '../view/index.js';

export const getInlineRangeProvider: (
  element: BlockComponent
) => InlineRangeProvider | null = element => {
  const editorHost = element.host;
  const selectionManager = editorHost.selection;
  const rangeManager = editorHost.range;

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

      const block = startElement?.closest(`[${BLOCK_ID_ATTR}]`);
      if (!block || block !== element) return false;
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

    if (!element.model.text) {
      throw new BlockSuiteError(
        ErrorCode.SelectionError,
        'element to set text selection has no text'
      );
    }

    return {
      index: 0,
      length: element.model.text.length,
    };
  };

  const setInlineRange = (inlineRange: InlineRange | null) => {
    // skip `setInlineRange` from `inlineEditor` when composing happens across blocks,
    // selection will be updated in `range-binding`
    if (rangeManager.binding?.isComposing) return;

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
  };
  const inlineRange$: InlineRangeProvider['inlineRange$'] = signal(null);
  selectionManager.slots.changed.on(selections => {
    const textSelection = selections.find(s => s.type === 'text') as
      | TextSelection
      | undefined;
    const range = rangeManager.value;
    if (!range || !textSelection) {
      inlineRange$.value = null;
      return;
    }
    const inlineRange = calculateInlineRange(range, textSelection);
    inlineRange$.value = inlineRange;
  });

  return {
    setInlineRange,
    inlineRange$,
  };
};
