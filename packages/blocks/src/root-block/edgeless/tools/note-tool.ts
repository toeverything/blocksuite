import type { PointerEventState } from '@blocksuite/block-std';

import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { noop, Point } from '@blocksuite/global/utils';

import type { SelectionArea } from '../services/tools-manager.js';
import type { EdgelessTool } from '../types.js';

import {
  hasClassNameInList,
  type NoteChildrenFlavour,
} from '../../../_common/utils/index.js';
import {
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  NOTE_INIT_HEIGHT,
  NOTE_MIN_WIDTH,
} from '../utils/consts.js';
import { addNote } from '../utils/note.js';
import { DraggingNoteOverlay, NoteOverlay } from '../utils/tool-overlay.js';
import { EdgelessToolController } from './edgeless-tool.js';

export type NoteTool = {
  type: 'affine:note';
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  tip: string;
};

export class NoteToolController extends EdgelessToolController<NoteTool> {
  private _draggingNoteOverlay: DraggingNoteOverlay | null = null;

  private _noteOverlay: NoteOverlay | null = null;

  protected override _draggingArea: SelectionArea | null = null;

  readonly tool = {
    type: 'affine:note',
    childFlavour: 'affine:paragraph',
    childType: 'text',
    tip: 'Text',
  } as NoteTool;

  // Ensure clear overlay before adding a new note
  private _clearOverlay() {
    this._noteOverlay = this._disposeOverlay(this._noteOverlay);
    this._draggingNoteOverlay = this._disposeOverlay(this._draggingNoteOverlay);
    this._edgeless.surface.refresh();
  }

  private _disposeOverlay(overlay: NoteOverlay | null) {
    if (!overlay) return null;

    overlay.dispose();
    this._edgeless.surface.renderer.removeOverlay(overlay);
    return null;
  }

  // Should hide overlay when mouse is out of viewport or on menu and toolbar
  private _hideOverlay() {
    if (!this._noteOverlay) return;

    this._noteOverlay.globalAlpha = 0;
    this._edgeless.surface.refresh();
  }

  private _resize(shift = false) {
    const { _draggingArea, _draggingNoteOverlay, _edgeless } = this;
    if (!_draggingArea || !_draggingNoteOverlay) return;

    const { viewport } = _edgeless.service;
    const { zoom } = viewport;
    const {
      start: { x: startX, y: startY },
      end,
    } = _draggingArea;
    let { x: endX, y: endY } = end;

    if (shift) {
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      const m = Math.max(w, h);
      endX = startX + (endX > startX ? m : -m);
      endY = startY + (endY > startY ? m : -m);
    }

    const [x, y] = viewport.toModelCoord(
      Math.min(startX, endX),
      Math.min(startY, endY)
    );
    const w = Math.abs(startX - endX) / zoom;
    const h = Math.abs(startY - endY) / zoom;

    _draggingNoteOverlay.slots.draggingNoteUpdated.emit({
      xywh: [x, y, w, h],
    });
  }

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._noteOverlay) return;
    this._noteOverlay.x = x;
    this._noteOverlay.y = y;
    this._edgeless.surface.refresh();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'affine:note') return;

    const attributes =
      this._edgeless.std.get(EditPropsStore).lastProps$.value['affine:note'];
    const background = attributes.background;
    this._noteOverlay = new NoteOverlay(this._edgeless, background);
    this._noteOverlay.text = newTool.tip;
    this._edgeless.surface.renderer.addOverlay(this._noteOverlay);
  }

  beforeModeSwitch() {
    this._clearOverlay();
  }

  onContainerClick(e: PointerEventState): void {
    this._clearOverlay();

    const { childFlavour, childType } = this.tool;
    const options = {
      childFlavour,
      childType,
      collapse: false,
    };
    const point = new Point(e.point.x, e.point.y);
    addNote(this._edgeless, point, options);
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerDragEnd() {
    if (!this._draggingNoteOverlay) return;
    this._draggingArea = null;

    const { x, y, width, height } = this._draggingNoteOverlay;

    this._disposeOverlay(this._draggingNoteOverlay);

    const { childFlavour, childType } = this.tool;

    const options = {
      childFlavour,
      childType,
      collapse: true,
    };

    const [viewX, viewY] = this._edgeless.service.viewport.toViewCoord(x, y);

    const point = new Point(viewX, viewY);

    this._doc.captureSync();

    addNote(
      this._edgeless,
      point,
      options,
      Math.max(width, NOTE_MIN_WIDTH),
      Math.max(height, NOTE_INIT_HEIGHT)
    );
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._draggingNoteOverlay || !this._draggingArea) return;

    this._draggingArea.end = new DOMPoint(e.x, e.y);
    this._resize(e.keys.shift || this._edgeless.tools.shiftKey);
  }

  onContainerDragStart(e: PointerEventState) {
    this._clearOverlay();

    const attributes =
      this._edgeless.std.get(EditPropsStore).lastProps$.value['affine:note'];
    const background = attributes.background;
    this._draggingNoteOverlay = new DraggingNoteOverlay(
      this._edgeless,
      background
    );
    this._edgeless.surface.renderer.addOverlay(this._draggingNoteOverlay);

    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerMouseMove(e: PointerEventState) {
    if (!this._noteOverlay) return;

    // if mouse is in viewport and move, update overlay pointion and show overlay
    if (this._noteOverlay.globalAlpha === 0) this._noteOverlay.globalAlpha = 1;
    const [x, y] = this._service.viewport.toModelCoord(e.x, e.y);
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

  onContainerPointerDown(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(pressed: boolean) {
    if (!this._draggingNoteOverlay) return;
    this._resize(pressed);
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      note: NoteToolController;
    }
  }
}
