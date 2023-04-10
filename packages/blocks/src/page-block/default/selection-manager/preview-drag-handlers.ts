import {
  createDragEvent,
  Point,
  type SelectionEvent,
} from '@blocksuite/blocks/std';
import { SCROLL_THRESHOLD } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { DefaultSelectionManager } from './default-selection-manager.js';

// distance to the upper and lower boundaries of the viewport
const threshold = SCROLL_THRESHOLD / 2;

export const PreviewDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { container, state } = selection;
    state.blur();
    state.type = 'block:drag';
    container.components.dragHandle?.onDragStart(
      createDragEvent('dragstart', e.raw),
      true
    );
  },

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { container, state } = selection;
    const { y, raw } = e;

    const { viewportElement } = selection;
    const { viewport } = state;
    const { scrollHeight, clientHeight } = viewport;
    let { scrollTop } = viewport;
    const max = scrollHeight - clientHeight;

    const { clientX, clientY } = raw;
    const lastPoint = (state.lastPoint = new Point(clientX, clientY));

    assertExists(lastPoint);

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
        lastPoint.y + d;
        auto = Math.ceil(scrollTop) < max;
        viewportElement.scrollTop = scrollTop;
        container.components.dragHandle?.onDrag(
          createDragEvent(
            'drag',
            new MouseEvent('mousemove', {
              clientX: lastPoint.x,
              clientY: lastPoint.y,
              screenY: 1,
            })
          ),
          true,
          true
        );
      } else if (scrollTop > 0 && y < threshold) {
        // ↑
        const d = (y - threshold) * 0.25;
        scrollTop += d;
        lastPoint.y + d;
        auto = scrollTop > 0;
        viewportElement.scrollTop = scrollTop;
        container.components.dragHandle?.onDrag(
          createDragEvent(
            'drag',
            new MouseEvent('mousemove', {
              clientX: lastPoint.x,
              clientY: lastPoint.y,
              screenY: 1,
            })
          ),
          true,
          true
        );
      } else {
        auto = false;

        container.components.dragHandle?.onDrag(
          createDragEvent('drag', raw),
          true
        );
      }
    };

    state.clearRaf();
    state.rafID = requestAnimationFrame(autoScroll);
  },

  onEnd(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { container, state } = selection;
    state.clearRaf();
    state.lastPoint = null;
    container.components.dragHandle?.onDragEnd(
      createDragEvent('dragend', e.raw),
      true
    );
  },

  clear(selection: DefaultSelectionManager) {
    const { container } = selection;
    container.components.dragHandle?.onDragEnd(createDragEvent('dragend'));
  },
};
