import type { PointerEventState } from '@blocksuite/block-std';
import { Overlay } from '@blocksuite/phasor';

import {
  type EdgelessTool,
  type NoteTool,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { DEFAULT_NOTE_WIDTH } from '../utils/consts.js';
import { addNote, type NoteOptions } from '../utils/note.js';
import { EdgelessToolController } from './index.js';

const OVERLAY_OFFSET_X = 6;
const OVERLAY_OFFSET_Y = 6;
const OVERLAY_WIDTH = 100;
const OVERLAY_HEIGHT = 50;
const OVERLAY_CORNER_RADIUS = 6;
const OVERLAY_STOKE_COLOR = '#E3E2E4';
const OVERLAY_TEXT_COLOR = '#77757D';

class NoteOverlay extends Overlay {
  x = 0;
  y = 0;
  text = '';
  globalAlpha = 0;
  backgroundColor = 'rgba(0, 0, 0, 0)';
  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.globalAlpha;
    // TODO: use theme color (should consider dark mode)
    // Draw the overlay rectangle
    ctx.strokeStyle = OVERLAY_STOKE_COLOR;
    ctx.fillStyle = this.backgroundColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + OVERLAY_CORNER_RADIUS, this.y);
    ctx.lineTo(this.x + OVERLAY_WIDTH - OVERLAY_CORNER_RADIUS, this.y);
    ctx.quadraticCurveTo(
      this.x + OVERLAY_WIDTH,
      this.y,
      this.x + OVERLAY_WIDTH,
      this.y + OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(
      this.x + OVERLAY_WIDTH,
      this.y + OVERLAY_HEIGHT - OVERLAY_CORNER_RADIUS
    );
    ctx.quadraticCurveTo(
      this.x + OVERLAY_WIDTH,
      this.y + OVERLAY_HEIGHT,
      this.x + OVERLAY_WIDTH - OVERLAY_CORNER_RADIUS,
      this.y + OVERLAY_HEIGHT
    );
    ctx.lineTo(this.x + OVERLAY_CORNER_RADIUS, this.y + OVERLAY_HEIGHT);
    ctx.quadraticCurveTo(
      this.x,
      this.y + OVERLAY_HEIGHT,
      this.x,
      this.y + OVERLAY_HEIGHT - OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(this.x, this.y + OVERLAY_CORNER_RADIUS);
    ctx.quadraticCurveTo(
      this.x,
      this.y,
      this.x + OVERLAY_CORNER_RADIUS,
      this.y
    );
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Draw the overlay text
    ctx.fillStyle = OVERLAY_TEXT_COLOR;
    let fontSize = 16;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // measure the width of the text
    // if the text is wider than the rectangle, reduce the maximum width of the text
    while (ctx.measureText(this.text).width > OVERLAY_WIDTH - 10) {
      fontSize -= 1;
      ctx.font = `${fontSize}px Arial`;
    }

    ctx.fillText(this.text, this.x + 10, this.y + OVERLAY_HEIGHT / 2);
  }
}
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

  private _getOverlayText() {
    const text = this.tool.tip;
    return text[0].toUpperCase() + text.slice(1);
  }

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._noteOverlay) return;
    this._noteOverlay.x = x + OVERLAY_OFFSET_X;
    this._noteOverlay.y = y + OVERLAY_OFFSET_Y;
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
    this._noteOverlay.text = this._getOverlayText();
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
    this._noteOverlay = new NoteOverlay();
    this._noteOverlay.text = this._getOverlayText();
    this._edgeless.surface.viewport.addOverlay(this._noteOverlay);
  }
}
