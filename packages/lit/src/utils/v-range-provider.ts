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

    const { from, to } = textSelection;
    const selectedElements =
      rangeManager.getSelectedBlockElementsByRange(range);
    if (!selectedElements.includes(element)) {
      return null;
    }

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

  const vRangeUpdatedSlot = new Slot<VRangeUpdatedProp>();
  selectionManager.slots.changed.on(() => {
    const vRange = getVRange();
    vRangeUpdatedSlot.emit([vRange, false]);
  });

  return {
    setVRange,
    getVRange,
    vRangeUpdatedSlot,
  };
};
