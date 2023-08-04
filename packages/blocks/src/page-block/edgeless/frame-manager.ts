import {
  Bound,
  FrameElement,
  Overlay,
  type RoughCanvas,
} from '@blocksuite/phasor';

import type { EdgelessElement } from '../../__internal__/utils/types.js';
import type { NoteBlockModel } from '../../models.js';
import { getGridBound } from './components/utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import type { Selectable } from './services/tools-manager.js';
import { BlendColor, NoteColor, SurfaceColor } from './utils/consts.js';
import { isTopLevelBlock } from './utils/query.js';

class FrameOverlay extends Overlay {
  bound: Bound | null = null;
  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
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
      const bound = eles.reduce((pre, ele) => {
        return pre.unite(getGridBound(ele));
      }, getGridBound(eles[0]));
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
}
