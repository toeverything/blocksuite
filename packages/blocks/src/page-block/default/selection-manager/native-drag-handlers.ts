import {
  handleNativeRangeDragMove,
  Point,
  type SelectionEvent,
} from '@blocksuite/blocks/std';

import type { DefaultSelectionManager } from './default-selection-manager.js';

export const NativeDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    selection.state.resetStartRange(e);
    selection.state.type = 'native';
    selection.slots.nativeSelectionToggled.emit(false);
  },

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    selection.state.lastPoint = new Point(e.raw.clientX, e.raw.clientY);
    handleNativeRangeDragMove(selection.state.startRange, e);
  },

  onEnd(selection: DefaultSelectionManager, _: SelectionEvent) {
    selection.slots.nativeSelectionToggled.emit(true);
  },
};
