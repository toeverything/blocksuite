import { assertExists } from '@blocksuite/global/utils';
import { Bound, TextElement } from '@blocksuite/phasor';
import * as Y from 'yjs';

import {
  getEditorContainer,
  type SelectionEvent,
  type TextMouseMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { SurfaceTextEditor } from '../components/surface-text-editor.js';
import { getSelectedRect } from '../components/utils.js';
import { addText, DEFAULT_FRAME_WIDTH } from '../utils.js';
import { MouseModeController } from './index.js';

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
    type: 'text',
  };

  private _dragStartEvent: SelectionEvent | null = null;

  private _addText(e: SelectionEvent, width = DEFAULT_FRAME_WIDTH) {
    addText(this._edgeless, this._page, e, width);
  }

  onContainerClick(e: SelectionEvent): void {
    // this._addText(e);

    const selected = this._surface.pickTop(e.x, e.y);
    if (!selected) {
      const [modelX, modelY] = this._surface.viewport.toModelCoord(e.x, e.y);
      const id = this._surface.addElement('text', {
        xywh: new Bound(modelX, modelY, 32, 32).serialize(),
        text: new Y.Text(),
        textAlign: 'left',
      });
      const textElement = this._surface.pickById(id);
      assertExists(textElement);
      if (textElement instanceof TextElement) {
        const textEditor = new SurfaceTextEditor();
        const pageBlockContainer = this._edgeless.pageBlockContainer;

        pageBlockContainer.appendChild(textEditor);
        textEditor.mount(textElement, this._edgeless);
        textEditor.vEditor?.focusEnd();
      }
    }
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerTripleClick(e: SelectionEvent) {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    // this._dragStartEvent = e;
    // this._draggingArea = {
    //   start: new DOMPoint(e.x, e.y),
    //   end: new DOMPoint(e.x, e.y),
    // };
  }

  onContainerDragMove(e: SelectionEvent) {
    // if (this._draggingArea) {
    //   this._draggingArea.end = new DOMPoint(e.x, e.y);
    //   this._edgeless.slots.hoverUpdated.emit();
    // }
  }

  onContainerDragEnd(e: SelectionEvent) {
    // if (this._dragStartEvent) {
    //   const startEvent =
    //     e.x > this._dragStartEvent.x ? this._dragStartEvent : e;
    //   const width = Math.max(
    //     Math.abs(e.x - this._dragStartEvent.x),
    //     DEFAULT_FRAME_WIDTH
    //   );
    //   this._addText(startEvent, width);
    // }
    // this._dragStartEvent = null;
    // this._draggingArea = null;
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
