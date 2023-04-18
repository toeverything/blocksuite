import type { SelectionEvent } from '../../../__internal__/index.js';
import {
  handleNativeRangeDragMove,
  noop,
  Point,
} from '../../../__internal__/index.js';
import type { DefaultSelectionManager } from './default-selection-manager.js';
import { autoScroll } from './utils.js';

export const NativeDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    selection.state.resetStartRange(e);
    selection.state.type = 'native';
  },

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    autoScroll(selection, e, {
      init() {
        selection.state.lastPoint = new Point(e.raw.clientX, e.raw.clientY);
        handleNativeRangeDragMove(selection.state.startRange, e);
      },
      onMove: noop,
      onScroll: noop,
    });
  },

  onEnd(selection: DefaultSelectionManager, _: SelectionEvent) {
    selection.state.clearRaf();
  },
};
