import type { SelectionEvent } from '@blocksuite/blocks/std';
import { SCROLL_THRESHOLD } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { DefaultSelectionManager } from './default-selection-manager.js';

// distance to the upper and lower boundaries of the viewport
const threshold = SCROLL_THRESHOLD / 2;

export const BlockDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { state } = selection;
    // rich-text should be unfocused
    state.blur();
    state.type = 'block';
    selection.updateViewport();

    const { scrollLeft, scrollTop } = state.viewport;
    state.resetDraggingArea(e, {
      scrollTop,
      scrollLeft,
    });
    state.refreshBlockRectCache();
  },

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { state } = selection;
    const { x, y } = e;

    const { viewportElement } = selection;
    const { viewport } = state;
    const { scrollHeight, clientHeight, scrollLeft } = viewport;
    let { scrollTop } = viewport;
    const max = scrollHeight - clientHeight;

    const { draggingArea } = state;

    assertExists(draggingArea);

    draggingArea.end.x = x + scrollLeft;
    draggingArea.end.y = y + scrollTop;

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
        draggingArea.end.y += d;
        auto = Math.ceil(scrollTop) < max;
        viewportElement.scrollTop = scrollTop;
        selection.updateDraggingArea(draggingArea);
      } else if (scrollTop > 0 && y < threshold) {
        // ↑
        const d = (y - threshold) * 0.25;
        scrollTop += d;
        draggingArea.end.y += d;
        auto = scrollTop > 0;
        viewportElement.scrollTop = scrollTop;
        selection.updateDraggingArea(draggingArea);
      } else {
        auto = false;
        const rect = selection.updateDraggingArea(draggingArea);
        selection.selectBlocksByDraggingArea(state.blockCache, rect, viewport);
      }
    };

    state.clearRaf();
    state.rafID = requestAnimationFrame(autoScroll);
  },

  onEnd(selection: DefaultSelectionManager, _: SelectionEvent) {
    selection.state.type = 'block';
    selection.state.clearDraggingArea();
    selection.slots.draggingAreaUpdated.emit(null);
    // do not clear selected rects here
  },
};
