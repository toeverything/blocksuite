import type { SelectionEvent } from '@blocksuite/blocks/std';
import { assertExists } from '@blocksuite/global/utils';

import type { DefaultSelectionManager } from './default-selection-manager.js';
import { autoScroll } from './utils.js';

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
    autoScroll(selection, e, {
      init() {
        const { x, y } = e;
        const {
          draggingArea,
          viewport: { scrollLeft, scrollTop },
        } = selection.state;

        assertExists(draggingArea);

        draggingArea.end.x = x + scrollLeft;
        draggingArea.end.y = y + scrollTop;
      },
      onScroll(d) {
        const { draggingArea } = selection.state;

        assertExists(draggingArea);

        draggingArea.end.y += d;
        selection.updateDraggingArea(draggingArea);
      },
      onMove() {
        const { blockCache, draggingArea, viewport } = selection.state;

        assertExists(draggingArea);

        const rect = selection.updateDraggingArea(draggingArea);
        selection.selectBlocksByDraggingArea(blockCache, rect, viewport);
      },
    });
  },

  onEnd(selection: DefaultSelectionManager, _: SelectionEvent) {
    selection.state.type = 'block';
    selection.state.clearDraggingArea();
    selection.slots.draggingAreaUpdated.emit(null);
    // do not clear selected rects here
  },
};
