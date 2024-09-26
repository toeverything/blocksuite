import type { SurfaceBlockComponent } from '@blocksuite/affine-block-surface';
import type { PointerEventState } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { type NoteBlockModel, NoteDisplayMode } from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { handleNativeRangeAtPoint } from '@blocksuite/affine-shared/utils';
import { BaseTool, type GfxController } from '@blocksuite/block-std/gfx';
import { type IPoint, Point, serializeXYWH } from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';

import {
  hasClassNameInList,
  type NoteChildrenFlavour,
} from '../../../_common/utils/index.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  NOTE_INIT_HEIGHT,
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
} from '../utils/consts.js';
import { addBlock } from '../utils/crud.js';
import { DraggingNoteOverlay, NoteOverlay } from '../utils/tool-overlay.js';

type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  collapse: boolean;
};

function addNoteWithPoint(
  gfx: GfxController,
  point: IPoint,
  options: {
    width?: number;
    height?: number;
    parentId?: string;
    noteIndex?: number;
    offsetX?: number;
    offsetY?: number;
    scale?: number;
  } = {}
) {
  const {
    width = DEFAULT_NOTE_WIDTH,
    height = DEFAULT_NOTE_HEIGHT,
    offsetX = DEFAULT_NOTE_OFFSET_X,
    offsetY = DEFAULT_NOTE_OFFSET_Y,
    parentId = gfx.doc.root?.id,
    noteIndex: noteIndex,
    scale = 1,
  } = options;
  const [x, y] = gfx.viewport.toModelCoord(point.x, point.y);
  const blockId = addBlock(
    gfx.std,
    'affine:note',
    {
      xywh: serializeXYWH(
        x - offsetX * scale,
        y - offsetY * scale,
        width,
        height
      ),
      displayMode: NoteDisplayMode.EdgelessOnly,
    },
    parentId,
    noteIndex
  );

  gfx.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
    control: 'canvas:draw',
    page: 'whiteboard editor',
    module: 'toolbar',
    segment: 'toolbar',
    type: 'note',
  });

  return blockId;
}

function addNote(
  gfx: GfxController,
  point: Point,
  options: NoteOptions,
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT
) {
  const noteId = addNoteWithPoint(gfx, point, {
    width,
    height,
  });

  const doc = gfx.doc;

  const blockId = doc.addBlock(
    options.childFlavour,
    { type: options.childType },
    noteId
  );
  if (options.collapse && height > NOTE_MIN_HEIGHT) {
    const note = doc.getBlockById(noteId) as NoteBlockModel;
    doc.updateBlock(note, () => {
      note.edgeless.collapse = true;
      note.edgeless.collapsedHeight = height;
    });
  }
  gfx.tool.setTool('default');

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (doc.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as BlockSuite.EdgelessBlockModelType[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      gfx.selection.set({
        elements: [element.id],
        editing: true,
      });

      // Waiting dom updated, `note mask` is removed
      if (blockId) {
        focusTextModel(gfx.std, blockId);
      } else {
        // Cannot reuse `handleNativeRangeClick` directly here,
        // since `retargetClick` will re-target to pervious editor
        handleNativeRangeAtPoint(point.x, point.y);
      }
    }
  });
}

export type NoteToolOption = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  tip: string;
};

export class NoteTool extends BaseTool<NoteToolOption> {
  static override toolName = 'affine:note';

  private _draggingNoteOverlay: DraggingNoteOverlay | null = null;

  private _noteOverlay: NoteOverlay | null = null;

  // Ensure clear overlay before adding a new note
  private _clearOverlay() {
    this._noteOverlay = this._disposeOverlay(this._noteOverlay);
    this._draggingNoteOverlay = this._disposeOverlay(this._draggingNoteOverlay);
    (this.gfx.surfaceComponent as SurfaceBlockComponent).refresh();
  }

  private _disposeOverlay(overlay: NoteOverlay | null) {
    if (!overlay) return null;

    overlay.dispose();
    (
      this.gfx.surfaceComponent as SurfaceBlockComponent
    )?.renderer.removeOverlay(overlay);
    return null;
  }

  // Should hide overlay when mouse is out of viewport or on menu and toolbar
  private _hideOverlay() {
    if (!this._noteOverlay) return;

    this._noteOverlay.globalAlpha = 0;
    (this.gfx.surfaceComponent as SurfaceBlockComponent)?.refresh();
  }

  private _resize(shift = false) {
    const { _draggingNoteOverlay } = this;
    if (!_draggingNoteOverlay) return;

    const draggingArea = this.controller.draggingArea$.peek();
    const { startX, startY } = draggingArea;
    let { endX, endY } = this.controller.draggingArea$.peek();

    if (shift) {
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      const m = Math.max(w, h);
      endX = startX + (endX > startX ? m : -m);
      endY = startY + (endY > startY ? m : -m);
    }

    _draggingNoteOverlay.slots.draggingNoteUpdated.emit({
      xywh: [
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(startX - endX),
        Math.abs(startY - endY),
      ],
    });
  }

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._noteOverlay) return;
    this._noteOverlay.x = x;
    this._noteOverlay.y = y;
    (this.gfx.surfaceComponent as SurfaceBlockComponent).refresh();
  }

  override activate() {
    const attributes =
      this.std.get(EditPropsStore).lastProps$.value['affine:note'];
    const background = attributes.background;
    this._noteOverlay = new NoteOverlay(this.gfx, background);
    this._noteOverlay.text = this.activatedOption.tip;
    (this.gfx.surfaceComponent as SurfaceBlockComponent).renderer.addOverlay(
      this._noteOverlay
    );
  }

  override click(e: PointerEventState): void {
    this._clearOverlay();

    const { childFlavour, childType } = this.activatedOption;
    const options = {
      childFlavour,
      childType,
      collapse: false,
    };
    const point = new Point(e.point.x, e.point.y);
    addNote(this.gfx, point, options);
  }

  override deactivate() {
    this._clearOverlay();
  }

  override dragEnd() {
    if (!this._draggingNoteOverlay) return;

    const { x, y, width, height } = this._draggingNoteOverlay;

    this._disposeOverlay(this._draggingNoteOverlay);

    const { childFlavour, childType } = this.activatedOption;

    const options = {
      childFlavour,
      childType,
      collapse: true,
    };

    const [viewX, viewY] = this.gfx.viewport.toViewCoord(x, y);

    const point = new Point(viewX, viewY);

    this.doc.captureSync();

    addNote(
      this.gfx,
      point,
      options,
      Math.max(width, NOTE_MIN_WIDTH),
      Math.max(height, NOTE_INIT_HEIGHT)
    );
  }

  override dragMove(e: PointerEventState) {
    if (!this._draggingNoteOverlay) return;

    this._resize(e.keys.shift || this.gfx.keyboard.shiftKey$.peek());
  }

  override dragStart() {
    this._clearOverlay();

    const attributes =
      this.std.get(EditPropsStore).lastProps$.value['affine:note'];
    const background = attributes.background;
    this._draggingNoteOverlay = new DraggingNoteOverlay(this.gfx, background);
    (this.gfx.surfaceComponent as SurfaceBlockComponent).renderer.addOverlay(
      this._draggingNoteOverlay
    );
  }

  override onload() {
    this.disposable.add(
      effect(() => {
        const shiftPressed = this.gfx.keyboard.shiftKey$.value;

        if (!this._draggingNoteOverlay) {
          return;
        }

        this._resize(shiftPressed);
      })
    );
  }

  override pointerMove(e: PointerEventState) {
    if (!this._noteOverlay) return;

    // if mouse is in viewport and move, update overlay pointion and show overlay
    if (this._noteOverlay.globalAlpha === 0) this._noteOverlay.globalAlpha = 1;
    const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
    this._updateOverlayPosition(x, y);
  }

  override pointerOut(e: PointerEventState) {
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
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {
      'affine:note': NoteTool;
    }

    interface GfxToolsOption {
      'affine:note': NoteToolOption;
    }
  }
}
