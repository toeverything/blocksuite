import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import {
  type EdgelessTool,
  hasClassNameInList,
  type NoteTool,
  queryCurrentMode,
} from '../../../__internal__/index.js';
import {
  DEFAULT_NOTE_WIDTH,
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
} from '../utils/consts.js';
import { addNote, type NoteOptions } from '../utils/note.js';
import { NoteOverlay } from '../utils/tool-overlay.js';
import { EdgelessToolController } from './index.js';

export class NoteToolController extends EdgelessToolController<NoteTool> {
  readonly tool = <NoteTool>{
    type: 'note',
    background: '--affine-background-secondary-color',
    childFlavour: 'affine:paragraph',
    childType: 'text',
    tip: 'Text',
  };

  private _dragStartEvent: PointerEventState | null = null;

  private _noteOverlay: NoteOverlay | null = null;

  private _addNote(
    e: PointerEventState,
    width = DEFAULT_NOTE_WIDTH,
    options: NoteOptions
  ) {
    addNote(this._edgeless, this._page, e, width, options);
  }

  onContainerPointerDown(e: PointerEventState): void {
    noop();
  }

  onContainerClick(e: PointerEventState): void {
    this._clearOverlay();

    const { childFlavour, childType } = this.tool;
    const options = {
      childFlavour,
      childType,
    };
    this._addNote(e, DEFAULT_NOTE_WIDTH, options);
  }

  onContainerContextMenu(e: PointerEventState): void {
    // this._hideOverlay();
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._clearOverlay();

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

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._noteOverlay) return;
    this._noteOverlay.x = x;
    this._noteOverlay.y = y;
    this._edgeless.surface.refresh();
  }

  // Ensure clear overlay before adding a new note
  private _clearOverlay() {
    if (!this._noteOverlay) return;

    this._noteOverlay.dispose();
    this._edgeless.surface.viewport.removeOverlay(this._noteOverlay);
    this._noteOverlay = null;
    this._edgeless.surface.refresh();
  }

  // Should hide overlay when mouse is out of viewport or on menu and toolbar
  private _hideOverlay() {
    if (!this._noteOverlay) return;

    this._noteOverlay.globalAlpha = 0;
    this._edgeless.surface.refresh();
  }

  onContainerMouseMove(e: PointerEventState) {
    if (!this._noteOverlay) return;

    // if mouse is in viewport and move, update overlay pointion and show overlay
    if (this._noteOverlay.globalAlpha === 0) this._noteOverlay.globalAlpha = 1;
    const [x, y] = this._surface.viewport.toModelCoord(e.x, e.y);
    this._updateOverlayPosition(x, y);
  }

  onContainerMouseOut(e: PointerEventState) {
    // should not hide the overlay when pointer on the area of other notes
    if (
      e.raw.relatedTarget &&
      hasClassNameInList(
        e.raw.relatedTarget as Element,
        EXCLUDING_MOUSE_OUT_CLASS_LIST
      )
    )
      return;
    this._hideOverlay();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    this._clearOverlay();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'note') return;

    this._noteOverlay = new NoteOverlay(this._edgeless);
    this._noteOverlay.text = newTool.tip;
    this._noteOverlay.themeMode = queryCurrentMode();
    this._edgeless.surface.viewport.addOverlay(this._noteOverlay);
  }
}
