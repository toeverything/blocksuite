import { assertExists } from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';

import { createDragEvent, Point } from '../../../__internal__/index.js';
import type { DefaultSelectionManager } from './selection-manager.js';
import { autoScroll } from './utils.js';

export const PreviewDragHandlers = {
  onStart(selection: DefaultSelectionManager, e: PointerEventState) {
    const { container, state } = selection;
    state.blur();
    container.components.dragHandle?.onDragStart(
      createDragEvent('dragstart', e.raw),
      true
    );
  },

  onMove(selection: DefaultSelectionManager, e: PointerEventState) {
    autoScroll(selection, e, {
      init() {
        const { state } = selection;
        const {
          raw: { clientX, clientY },
        } = e;
        state.lastPoint = new Point(clientX, clientY);
      },
      onScroll(_) {
        const {
          container,
          state: { lastPoint },
        } = selection;

        assertExists(lastPoint);

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

  onEnd(selection: DefaultSelectionManager, e: PointerEventState) {
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
