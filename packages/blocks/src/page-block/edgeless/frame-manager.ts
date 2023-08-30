import { assertExists } from '@blocksuite/global/utils';
import {
  Bound,
  FrameElement,
  Overlay,
  type RoughCanvas,
} from '@blocksuite/phasor';
import * as Y from 'yjs';

import type { EdgelessElement } from '../../__internal__/utils/types.js';
import type { NoteBlockModel } from '../../models.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { type Selectable } from './services/tools-manager.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import { BlendColor, NoteColor, SurfaceColor } from './utils/consts.js';
import { isTopLevelBlock } from './utils/query.js';

const MIN_FRAME_WIDTH = 800;
const MIN_FRAME_HEIGHT = 640;
const FRAME_PADDING = 40;
class FrameOverlay extends Overlay {
  bound: Bound | null = null;
  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    if (!this.bound) return;
    const { x, y, w, h } = this.bound;
    ctx.beginPath();
    ctx.fillStyle = '#3AB5F70A';
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
  }
}

export class EdgelessFrameManager {
  private _frameOverlay = new FrameOverlay();
  constructor(private _edgeless: EdgelessPageBlockComponent) {
    this._edgeless.surface.viewport.addOverlay(this._frameOverlay);
  }

  get frames() {
    return this._edgeless.surface.getElementsByType('frame') as FrameElement[];
  }

  selectFrame(eles: Selectable[]) {
    const frames = this._edgeless.frame.frames;
    if (!eles.some(ele => ele instanceof FrameElement) && frames.length !== 0) {
      const bound = edgelessElementsBound(eles);
      for (let i = frames.length - 1; i >= 0; i--) {
        const frame = frames[i];
        if (Bound.deserialize(frame.xywh).contains(bound)) {
          return frame;
        }
      }
    }
    return null;
  }

  setHighlight(frame: FrameElement) {
    const bound = Bound.deserialize(frame.xywh);
    this._frameOverlay.bound = bound;
    this._edgeless.surface.refresh();
  }

  clearHighlight() {
    this._frameOverlay.bound = null;
  }

  getElementsInFrame(frame: FrameElement) {
    const bound = Bound.deserialize(frame.xywh);
    const elements: EdgelessElement[] =
      this._edgeless.surface.viewport.gridManager
        .search(bound, true)
        .filter(ele => !(ele instanceof FrameElement));
    elements.push(
      ...(<NoteBlockModel[]>(
        this._edgeless.page.getBlockByFlavour('affine:note')
      )).filter(ele => bound.contains(Bound.deserialize(ele.xywh)))
    );
    return elements;
  }

  calculateFrameColor(frame: FrameElement) {
    const elements = this.getElementsInFrame(frame);
    let color = '';
    elements.forEach(element => {
      if (isTopLevelBlock(element)) {
        if (!color) color = NoteColor;
        if (color === SurfaceColor) color = BlendColor;
      } else {
        if (!color) color = SurfaceColor;
        if (color == NoteColor) color = BlendColor;
      }
    });
    color = color || NoteColor;
    frame.color = color;
    this._edgeless.surface.refresh();
  }

  createFrameOnSelected() {
    const { _edgeless } = this;
    const { surface } = _edgeless;
    const frames = this.frames;
    let bound = edgelessElementsBound(_edgeless.selectionManager.elements);
    bound = bound.expand(FRAME_PADDING);
    if (bound.w < MIN_FRAME_WIDTH) {
      const offset = (MIN_FRAME_WIDTH - bound.w) / 2;
      bound = bound.expand(offset, 0);
    }
    if (bound.h < MIN_FRAME_HEIGHT) {
      const offset = (MIN_FRAME_HEIGHT - bound.h) / 2;
      bound = bound.expand(0, offset);
    }
    const id = _edgeless.surface.addElement('frame', {
      title: new Y.Text(`Frame ${frames.length + 1}`),
      batch: 'a0',
      xywh: bound.serialize(),
    });
    _edgeless.page.captureSync();
    const frame = surface.pickById(id);
    assertExists(frame);
    _edgeless.selectionManager.setSelection({
      elements: [frame.id],
      editing: false,
    });
  }
}
