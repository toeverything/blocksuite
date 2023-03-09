import { serializeXYWH } from '@blocksuite/phasor';

import type {
  SelectionEvent,
  TextMouseMode,
} from '../../../__internal__/index.js';
import { handleNativeRangeAtPoint, noop } from '../../../__internal__/index.js';
import { getSelectionBoxBound, getXYWH } from '../utils.js';
import { MouseModeController } from './index.js';

const DEFAULT_FRAME_WIDTH = 448;
const DEFAULT_FRAME_HEIGHT = 72;
const DEFAULT_FRAME_OFFSET_X = 30;
const DEFAULT_FRAME_OFFSET_Y = 40;

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
    type: 'text',
  };

  private _dragStartEvent: SelectionEvent | null = null;

  private _addText(e: SelectionEvent, width = DEFAULT_FRAME_WIDTH) {
    const [modelX, modelY] = this._surface.toModelCoord(e.x, e.y);
    const frameId = this._page.addBlockByFlavour(
      'affine:frame',
      {
        xywh: serializeXYWH(
          modelX - DEFAULT_FRAME_OFFSET_X,
          modelY - DEFAULT_FRAME_OFFSET_Y,
          width,
          DEFAULT_FRAME_HEIGHT
        ),
      },
      this._page.root?.id
    );
    this._page.addBlockByFlavour('affine:paragraph', {}, frameId);
    this._edgeless.slots.mouseModeUpdated.emit({ type: 'default' });

    // waiting mouseMode updated
    requestAnimationFrame(() => {
      const element = this._blocks.find(b => b.id === frameId);
      if (element) {
        const selectionState = {
          selected: [element],
          active: true,
        };
        this._edgeless.setBlockSelectionState(selectionState);
        this._edgeless.slots.selectionUpdated.emit(selectionState);

        // Cannot use `handleNativeRangeClick`, because `handleClickRetargeting` will re-target to pervious editor
        handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
      }
    });
  }

  onContainerClick(e: SelectionEvent): void {
    this._addText(e);
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    this._dragStartEvent = e;
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: SelectionEvent) {
    if (this._draggingArea) {
      this._draggingArea.end = new DOMPoint(e.x, e.y);
      this._edgeless.slots.hoverUpdated.emit();
    }
  }

  onContainerDragEnd(e: SelectionEvent) {
    if (this._dragStartEvent) {
      const startEvent =
        e.x > this._dragStartEvent.x ? this._dragStartEvent : e;
      const width = Math.max(
        Math.abs(e.x - this._dragStartEvent.x),
        DEFAULT_FRAME_WIDTH
      );
      this._addText(startEvent, width);
    }

    this._dragStartEvent = null;
    this._draggingArea = null;
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  syncDraggingArea() {
    noop();
  }

  clearSelection() {
    noop();
  }
}
