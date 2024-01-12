import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import {
  type EdgelessTool,
  getThemeMode,
  hasClassNameInList,
  type NoteTool,
  Point,
} from '../../../../_common/utils/index.js';
import type { NoteBlockModel } from '../../../../models.js';
import { Bound } from '../../../../surface-block/utils/bound.js';
import type { SelectionArea } from '../../services/tools-manager.js';
import {
  DEFAULT_NOTE_WIDTH,
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
} from '../../utils/consts.js';
import { addNote, type NoteOptions } from '../../utils/note.js';
import { NoteOverlay } from '../../utils/tool-overlay.js';
import { EdgelessToolController } from './index.js';

export class NoteToolController extends EdgelessToolController<NoteTool> {
  readonly tool = <NoteTool>{
    type: 'affine:note',
    childFlavour: 'affine:paragraph',
    childType: 'text',
    tip: 'Text',
  };

  private _dragStartEvent: PointerEventState | null = null;

  private _noteOverlay: NoteOverlay | null = null;
  private _draggingElement: NoteBlockModel | null = null;
  private _draggingElementId: string | null = null;
  protected override _draggingArea: SelectionArea | null = null;

  private _addNote(
    e: PointerEventState,
    width = DEFAULT_NOTE_WIDTH,
    options: NoteOptions
  ) {
    addNote(this._edgeless, this._page, e, width, options);
  }

  private _addNoteWithBlock(
    e: PointerEventState,
    width = 0,
    height = 0,
    options: NoteOptions
  ) {
    const noteId = this._edgeless.addNoteWithPoint(
      new Point(e.point.x, e.point.y),
      {
        width,
        height,
      }
    );

    this._page.addBlock(
      options.childFlavour,
      { type: options.childType },
      noteId
    );

    return noteId;
  }

  onPressShiftKey(pressed: boolean) {
    const id = this._draggingElementId;
    if (!id) return;

    this._resize(pressed);
  }

  private _resize(shift = false) {
    const { _draggingElementId: id, _draggingArea, _edgeless } = this;
    assertExists(id);
    assertExists(_draggingArea);

    const { surface } = _edgeless;
    const { viewport } = surface;
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

    const bound = new Bound(x, y, w, h);

    this._surface.updateElement(id, {
      xywh: bound.serialize(),
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
    };
    this._addNote(e, DEFAULT_NOTE_WIDTH, options);
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

    this._page.captureSync();
    const options = {
      childFlavour: this.tool.childFlavour,
      childType: this.tool.childType,
    };

    const id = this._addNoteWithBlock(e, 0, 0, options);
    this._draggingElementId = id;
    this._draggingElement = this._surface.pickById(id) as NoteBlockModel;
    this._draggingElement.stash('xywh');

    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: PointerEventState) {
    assertExists(this._draggingElementId);
    assertExists(this._draggingArea);

    this._draggingArea.end = new DOMPoint(e.x, e.y);
    this._resize(e.keys.shift || this._edgeless.tools.shiftKey);
  }

  onContainerDragEnd() {
    if (this._draggingElement) {
      const draggingElement = this._draggingElement;

      this._page.transact(() => {
        draggingElement.pop('xywh');
      });
    }

    const id = this._draggingElementId;
    assertExists(id);

    if (this._draggingArea) {
      const width = Math.abs(
        this._draggingArea?.end.x - this._draggingArea?.start.x
      );
      const height = Math.abs(
        this._draggingArea?.end.y - this._draggingArea?.start.y
      );
      if (width < 20 && height < 20) {
        this._surface.removeElement(id);
        return;
      }
    }

    this._draggingElement = null;
    this._draggingElementId = null;
    this._draggingArea = null;

    this._page.captureSync();

    const element = this._surface.pickById(id);
    assertExists(element);
    this._edgeless.tools.switchToDefaultMode({
      elements: [element.id],
      editing: true,
    });
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

  beforeModeSwitch() {
    this._clearOverlay();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'affine:note') return;

    this._noteOverlay = new NoteOverlay(this._edgeless);
    this._noteOverlay.text = newTool.tip;
    this._noteOverlay.themeMode = getThemeMode();
    this._edgeless.surface.viewport.addOverlay(this._noteOverlay);
  }
}
