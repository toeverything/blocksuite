import type { PointerEventState } from '@blocksuite/block-std';

import {
  type EdgelessTool,
  type NoteTool,
  queryCurrentMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import {
  DEFAULT_NOTE_WIDTH,
  NOTE_OVERLAY_OFFSET_X,
  NOTE_OVERLAY_OFFSET_Y,
} from '../utils/consts.js';
import { addNote, type NoteOptions } from '../utils/note.js';
import { NoteOverlay } from '../utils/tool-overlay.js';
import { EdgelessToolController } from './index.js';

// class NoteOverlay extends Overlay {
//   x = 0;
//   y = 0;
//   text = '';
//   globalAlpha = 0;
//   themeMode = 'light';
//   _edgeless: EdgelessPageBlockComponent;
//   _disposables!: DisposableGroup;
//   _lastViewportX: number;
//   _lastViewportY: number;

//   private _getOverlayText(text: string): string {
//     return text[0].toUpperCase() + text.slice(1);
//   }

//   constructor(edgeless: EdgelessPageBlockComponent) {
//     super();
//     this._edgeless = edgeless;
//     this._disposables = new DisposableGroup();
//     this._lastViewportX = edgeless.surface.viewport.viewportX;
//     this._lastViewportY = edgeless.surface.viewport.viewportY;
//     this._disposables.add(
//       this._edgeless.slots.viewportUpdated.on(() => {
//         // get current viewport position
//         const currentViewportX = this._edgeless.surface.viewport.viewportX;
//         const currentViewportY = this._edgeless.surface.viewport.viewportY;
//         // calculate position delta
//         const deltaX = currentViewportX - this._lastViewportX;
//         const deltaY = currentViewportY - this._lastViewportY;
//         // update overlay current position
//         this.x += deltaX;
//         this.y += deltaY;
//         // update last viewport position
//         this._lastViewportX = currentViewportX;
//         this._lastViewportY = currentViewportY;
//         // refresh to show new overlay
//         this._edgeless.surface.refresh();
//       })
//     );
//     this._disposables.add(
//       this._edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
//         // when change note child type, update overlay text
//         if (edgelessTool.type === 'note') {
//           this.text = this._getOverlayText(edgelessTool.tip);
//         }
//       })
//     );
//   }

//   override render(ctx: CanvasRenderingContext2D): void {
//     ctx.globalAlpha = this.globalAlpha;
//     // Draw the overlay rectangle
//     ctx.strokeStyle = NOTE_OVERLAY_STOKE_COLOR;
//     ctx.fillStyle =
//       this.themeMode === 'light'
//         ? NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR
//         : NOTE_OVERLAY_DARK_BACKGROUND_COLOR;
//     ctx.lineWidth = 4;
//     ctx.beginPath();
//     ctx.moveTo(this.x + NOTE_OVERLAY_CORNER_RADIUS, this.y);
//     ctx.lineTo(
//       this.x + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
//       this.y
//     );
//     ctx.quadraticCurveTo(
//       this.x + NOTE_OVERLAY_WIDTH,
//       this.y,
//       this.x + NOTE_OVERLAY_WIDTH,
//       this.y + NOTE_OVERLAY_CORNER_RADIUS
//     );
//     ctx.lineTo(
//       this.x + NOTE_OVERLAY_WIDTH,
//       this.y + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
//     );
//     ctx.quadraticCurveTo(
//       this.x + NOTE_OVERLAY_WIDTH,
//       this.y + NOTE_OVERLAY_HEIGHT,
//       this.x + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
//       this.y + NOTE_OVERLAY_HEIGHT
//     );
//     ctx.lineTo(
//       this.x + NOTE_OVERLAY_CORNER_RADIUS,
//       this.y + NOTE_OVERLAY_HEIGHT
//     );
//     ctx.quadraticCurveTo(
//       this.x,
//       this.y + NOTE_OVERLAY_HEIGHT,
//       this.x,
//       this.y + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
//     );
//     ctx.lineTo(this.x, this.y + NOTE_OVERLAY_CORNER_RADIUS);
//     ctx.quadraticCurveTo(
//       this.x,
//       this.y,
//       this.x + NOTE_OVERLAY_CORNER_RADIUS,
//       this.y
//     );
//     ctx.closePath();
//     ctx.stroke();
//     ctx.fill();

//     // Draw the overlay text
//     ctx.fillStyle = NOTE_OVERLAY_TEXT_COLOR;
//     let fontSize = 16;
//     ctx.font = `${fontSize}px Arial`;
//     ctx.textAlign = 'left';
//     ctx.textBaseline = 'middle';

//     // measure the width of the text
//     // if the text is wider than the rectangle, reduce the maximum width of the text
//     while (ctx.measureText(this.text).width > NOTE_OVERLAY_WIDTH - 20) {
//       fontSize -= 1;
//       ctx.font = `${fontSize}px Arial`;
//     }

//     ctx.fillText(this.text, this.x + 10, this.y + NOTE_OVERLAY_HEIGHT / 2);
//   }
// }
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
    this._noteOverlay.x = x + NOTE_OVERLAY_OFFSET_X;
    this._noteOverlay.y = y + NOTE_OVERLAY_OFFSET_Y;
    this._edgeless.surface.refresh();
  }

  // Ensure clear overlay before adding a new note
  private _clearOverlay() {
    if (!this._noteOverlay) return;

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
