import type { TextSelection } from '@blocksuite/block-std';
import { assertExists, Slot } from '@blocksuite/global/utils';
import type {
  VRange,
  VRangeProvider,
  VRangeUpdatedProp,
} from '@blocksuite/virgo';

import type { BlockElement } from '../element/block-element.js';

export const getVRangeProvider: (
  element: BlockElement
) => VRangeProvider = element => {
  const root = element.root;
  const selectionManager = root.selection;
  const rangeManager = root.rangeManager;

  assertExists(selectionManager);
  assertExists(rangeManager);

  const isElementSelected = (range: Range): boolean => {
    // Most cases, the range is collapsed, so we no need to use `intersectsNode`
    // because its performance is not good enough.
    if (range.collapsed) {
      const blockElement = range.startContainer.parentElement?.closest(
        `[${root.blockIdAttr}]`
      );
      if (!blockElement || blockElement !== element) return false;
    } else {
      if (!range.intersectsNode(element)) return false;
    }
    return true;
  };

  const calculateVRange = (
    range: Range,
    textSelection: TextSelection
  ): VRange | null => {
    if (!isElementSelected(range)) {
      return null;
    }

    const { from, to } = textSelection;

    if (from.path === element.path) {
      return {
        index: from.index,
        length: from.length,
      };
    }

    if (to?.path === element.path) {
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
  const setVRange = (vRange: VRange | null) => {
    if (!vRange) {
      selectionManager.clear(['text']);
    } else {
      const textSelection = selectionManager.getInstance('text', {
        from: {
          path: element.path,
          index: vRange.index,
          length: vRange.length,
        },
        to: null,
      });
      selectionManager.setGroup('note', [textSelection]);
    }
  };
  const getVRange = (): VRange | null => {
    const range = rangeManager?.value;
    if (!range) {
      return null;
    }

    const textSelection = selectionManager.find('text');
    if (!textSelection) {
      return null;
    }

    return calculateVRange(range, textSelection);
  };

  const vRangeUpdatedSlot = new Slot<VRangeUpdatedProp>();
  selectionManager.slots.changed.on(() => {
    const textSelection = selectionManager.find('text');
    if (!textSelection) return;

    const range = rangeManager.value;
    if (!range || !isElementSelected(range)) return;

    // wait for lit updated
    requestAnimationFrame(() => {
      const vRange = calculateVRange(range, textSelection);
      vRangeUpdatedSlot.emit([vRange, false]);
    });
  });

  return {
    setVRange,
    getVRange,
    vRangeUpdatedSlot,
  };
};
