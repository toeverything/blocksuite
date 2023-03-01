import {
  handleNativeRangeDragMove,
  SelectionEvent,
} from '@blocksuite/blocks/std';
import { SCROLL_THRESHOLD } from '@blocksuite/global/config';

import type { DefaultSelectionManager } from './default-selection-manager.js';

// distance to the upper and lower boundaries of the viewport
const threshold = SCROLL_THRESHOLD / 2;

export const NativeDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    selection.state.resetStartRange(e);
    selection.state.type = 'native';
    selection.slots.nativeSelectionToggled.emit(false);
  },

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { state, viewportElement } = selection;
    const {
      y,
      raw: { clientX, clientY },
    } = e;

    selection.state.updateRangePoint(clientX, clientY);
    handleNativeRangeDragMove(selection.state.startRange, e);

    const { viewport } = state;
    const { scrollHeight, clientHeight } = viewport;
    let { scrollTop } = viewport;
    const max = scrollHeight - clientHeight;

    let auto = true;
    const autoScroll = () => {
      if (!auto) {
        state.clearRaf();
        return;
      } else {
        state.rafID = requestAnimationFrame(autoScroll);
      }

      // TODO: for the behavior of scrolling, see the native selection
      // speed easeOutQuad + easeInQuad
      if (Math.ceil(scrollTop) < max && clientHeight - y < threshold) {
        // ↓
        const d = (threshold - (clientHeight - y)) * 0.25;
        scrollTop += d;
        auto = Math.ceil(scrollTop) < max;
        viewportElement.scrollTop = scrollTop;
      } else if (scrollTop > 0 && y < threshold) {
        // ↑
        const d = (y - threshold) * 0.25;
        scrollTop += d;
        auto = scrollTop > 0;
        viewportElement.scrollTop = scrollTop;
      } else {
        auto = false;
      }
    };

    state.clearRaf();
    state.rafID = requestAnimationFrame(autoScroll);
  },

  onEnd(selection: DefaultSelectionManager, _: SelectionEvent) {
    selection.state.clearRaf();
    selection.slots.nativeSelectionToggled.emit(true);
  },
};
