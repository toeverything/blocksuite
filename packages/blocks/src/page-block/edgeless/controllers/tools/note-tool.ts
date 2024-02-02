import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import {
  type EdgelessTool,
  hasClassNameInList,
  type NoteTool,
  Point,
} from '../../../../_common/utils/index.js';
import type { SelectionArea } from '../../services/tools-manager.js';
import {
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
} from '../../utils/consts.js';
import { addNote } from '../../utils/note.js';
import { DraggingNoteOverlay, NoteOverlay } from '../../utils/tool-overlay.js';
import { EdgelessToolController } from './index.js';

export class NoteToolController extends EdgelessToolController<NoteTool> {
  readonly tool = <NoteTool>{
    type: 'affine:note',
    childFlavour: 'affine:paragraph',
    childType: 'text',
    tip: 'Text',
  };

  private _noteOverlay: NoteOverlay | null = null;
  private _draggingNoteOverlay: DraggingNoteOverlay | null = null;
  protected override _draggingArea: SelectionArea | null = null;

  onPressShiftKey(pressed: boolean) {
    if (!this._draggingNoteOverlay) return;
    this._resize(pressed);
  }

  private _resize(shift = false) {
    const { _draggingArea, _draggingNoteOverlay, _edgeless } = this;
    assertExists(_draggingArea);
    assertExists(_draggingNoteOverlay);

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

  onContainerPointerDown(): void {
    noop();
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
    addNote(this._edgeless, this._page, point, options);
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._clearOverlay();

    const attributes =
      this._edgeless.service.editSession.getLastProps('affine:note');
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

  onContainerDragMove(e: PointerEventState) {
    assertExists(this._draggingNoteOverlay);
    assertExists(this._draggingArea);

    this._draggingArea.end = new DOMPoint(e.x, e.y);
    this._resize(e.keys.shift || this._edgeless.tools.shiftKey);
  }

  onContainerDragEnd() {
    if (!this._draggingNoteOverlay) return;
    this._draggingArea = null;

    const { x, y, width, height } = this._draggingNoteOverlay;
    this._disposeOverlay(this._draggingNoteOverlay);

    if (width < NOTE_MIN_WIDTH || height < NOTE_MIN_HEIGHT) {
      //TODO: add toast to notify user
      this._edgeless.tools.setEdgelessTool({ type: 'default' });
      return;
    }

    const { childFlavour, childType } = this.tool;
    const options = {
      childFlavour,
      childType,
      collapse: true,
    };
    const [viewX, viewY] = this._edgeless.service.viewport.toViewCoord(x, y);
    const point = new Point(viewX, viewY);

    this._page.captureSync();
    addNote(this._edgeless, this._page, point, options, width, height);
  }

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._noteOverlay) return;
    this._noteOverlay.x = x;
    this._noteOverlay.y = y;
    this._edgeless.surface.refresh();
  }

  private _disposeOverlay(overlay: NoteOverlay | null) {
    if (!overlay) return null;

    overlay.dispose();
    this._edgeless.surface.renderer.removeOverlay(overlay);
    return null;
  }

  // Ensure clear overlay before adding a new note
  private _clearOverlay() {
    this._noteOverlay = this._disposeOverlay(this._noteOverlay);
    this._draggingNoteOverlay = this._disposeOverlay(this._draggingNoteOverlay);
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

  beforeModeSwitch() {
    this._clearOverlay();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'affine:note') return;

    const attributes =
      this._edgeless.service.editSession.getLastProps('affine:note');
    const background = attributes.background;
    this._noteOverlay = new NoteOverlay(this._edgeless, background);
    this._noteOverlay.text = newTool.tip;
    this._edgeless.surface.renderer.addOverlay(this._noteOverlay);
  }
}
