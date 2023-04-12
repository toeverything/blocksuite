import { assertExists } from '@blocksuite/global/utils';

import type { SelectionEvent } from '../../../__internal__/index.js';
import { createDragEvent, Point } from '../../../__internal__/index.js';
import type { DefaultSelectionManager } from './default-selection-manager.js';
import { autoScroll } from './utils.js';

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
    autoScroll(selection, e, {
      init() {
        const { state } = selection;
        const {
          raw: { clientX, clientY },
        } = e;
        state.lastPoint = new Point(clientX, clientY);
      },
      onScroll(d) {
        const {
          container,
          state: { lastPoint },
        } = selection;

        assertExists(lastPoint);

        lastPoint.y + d;
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
      },
      onMove() {
        const { raw } = e;
        const { container } = selection;
        container.components.dragHandle?.onDrag(
          createDragEvent('drag', raw),
          true
        );
      },
    });
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
