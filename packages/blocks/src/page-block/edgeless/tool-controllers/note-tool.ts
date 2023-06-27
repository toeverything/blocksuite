import type { PointerEventState } from '@blocksuite/block-std';

import { type NoteTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addNote, DEFAULT_NOTE_WIDTH, type NoteOptions } from '../utils.js';
import { EdgelessToolController } from './index.js';

export class NoteToolController extends EdgelessToolController<NoteTool> {
  readonly tool = <NoteTool>{
    type: 'note',
    background: '--affine-background-secondary-color',
    childFlavour: 'affine:paragraph',
    childType: 'text',
  };

  private _dragStartEvent: PointerEventState | null = null;

  private _addNote(
    e: PointerEventState,
    width = DEFAULT_NOTE_WIDTH,
    options: NoteOptions
  ) {
    addNote(this._edgeless, this._page, e, width, options);
  }

  onContainerClick(e: PointerEventState): void {
    const { childFlavour, childType } = this.tool;
    const options = {
      childFlavour,
      childType,
    };
    this._addNote(e, DEFAULT_NOTE_WIDTH, options);
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._dragStartEvent = e;
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: PointerEventState) {
    if (this._draggingArea) {
      this._draggingArea.end = new DOMPoint(e.x, e.y);
      this._edgeless.slots.hoverUpdated.emit();
    }
  }

  onContainerDragEnd(e: PointerEventState) {
    const { childFlavour, childType } = this.tool;
    const options = {
      childFlavour,
      childType,
    };
    if (this._dragStartEvent) {
      const startEvent =
        e.x > this._dragStartEvent.x ? this._dragStartEvent : e;
      const width = Math.max(
        Math.abs(e.x - this._dragStartEvent.x),
        DEFAULT_NOTE_WIDTH
      );
      this._addNote(startEvent, width, options);
    }
    this._dragStartEvent = null;
    this._draggingArea = null;
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
