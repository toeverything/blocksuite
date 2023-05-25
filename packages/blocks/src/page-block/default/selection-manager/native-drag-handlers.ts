import type { PointerEventState } from '@blocksuite/lit';

import {
  handleNativeRangeDragMove,
  noop,
  Point,
} from '../../../__internal__/index.js';
import type { DefaultSelectionManager } from './default-selection-manager.js';
import { autoScroll } from './utils.js';

export const NativeDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: PointerEventState) {
    selection.state.resetStartRange(e);
    selection.state.type = 'native';
  },

  onMove(selection: DefaultSelectionManager, e: PointerEventState) {
    autoScroll(selection, e, {
      init() {
        selection.state.lastPoint = new Point(e.raw.clientX, e.raw.clientY);
        handleNativeRangeDragMove(selection.state.startRange, e);
      },
      onMove: noop,
      onScroll: noop,
    });
  },

  onEnd(selection: DefaultSelectionManager, _: PointerEventState) {
    selection.state.clearRaf();
  },
};
