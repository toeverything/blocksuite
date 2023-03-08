import { getCommonBound } from '@blocksuite/phasor';
import { Bound, deserializeXYWH, SurfaceManager } from '@blocksuite/phasor';
import { Page } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getBlockById } from '../../../__internal__/index.js';
import { EDGELESS_BLOCK_CHILD_PADDING } from '../../utils/container-operations.js';
import type { EdgelessSelectionState } from '../selection-manager.js';
import { FRAME_MIN_LENGTH, getXYWH, isTopLevelBlock } from '../utils.js';
import { EdgelessDragManager } from './drag-manager.js';
import type { ResizeMode } from './utils.js';
import { getCommonRectStyle, getHandles } from './utils.js';

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends LitElement {
  @property({ type: Page })
  page!: Page;

  @property({ type: SurfaceManager })
  surface!: SurfaceManager;

  @property({ type: Boolean })
  lock!: boolean;

  @property({ type: Number })
  zoom!: number;

  @property({ type: Object })
  state!: EdgelessSelectionState;

  @property({ type: DOMRect })
  rect!: DOMRect;

  private _dragManager: EdgelessDragManager;

  constructor() {
    super();
    this._dragManager = new EdgelessDragManager(
      this,
      this._onDragMove,
      this._onDragEnd
    );
  }

  get resizeMode(): ResizeMode {
    const hasBlockElement = this.state.selected.find(elem =>
      isTopLevelBlock(elem)
    );
    return hasBlockElement ? 'row-resize' : 'resize';
  }

  get modelBound(): Bound {
    const { selected } = this.state;
    if (!selected.length) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }
    const bounds = selected.map(s => {
      if (isTopLevelBlock(s)) {
        const [x, y, w, h] = deserializeXYWH(getXYWH(s));
        return { x, y, w, h };
      }
      return s;
    });

    return getCommonBound(bounds) as Bound;
  }

  private _onDragMove = (deltaBound: Bound) => {
    const oldBound = this.modelBound;
    const newBound = {
      x: oldBound.x + deltaBound.x,
      y: oldBound.y + deltaBound.y,
      w: oldBound.w + deltaBound.w,
      h: oldBound.h + deltaBound.h,
    };

    this.state.selected.forEach(element => {
      const [ex, ey, ew, eh] = deserializeXYWH(getXYWH(element));
      const x = (newBound.w * (ex - oldBound.x)) / oldBound.w + newBound.x;
      const y = (newBound.h * (ey - oldBound.y)) / oldBound.h + newBound.y;
      const w = (newBound.w * ew) / oldBound.w;
      const h = (newBound.h * eh) / oldBound.h;

      if (isTopLevelBlock(element)) {
        let frameX = x;
        let frameY = y;
        let frameW = w;
        let frameH = h;
        // limit the width of the selected frame
        if (frameW < FRAME_MIN_LENGTH) {
          frameW = FRAME_MIN_LENGTH;
          frameX = x;
        }
        // limit the height of the selected frame
        if (frameH < FRAME_MIN_LENGTH) {
          frameH = FRAME_MIN_LENGTH;
          frameY = y;
        }
        const frameBlock = getBlockById<'div'>(element.id);
        const frameContainer = frameBlock?.parentElement;
        // first change container`s x/w directly for get frames real height
        if (frameContainer) {
          frameContainer.style.width = frameW + 'px';
          frameContainer.style.translate = `translate(${frameX}px, ${frameY}px) scale(${this.zoom})`;
        }
        // reset the width of the container may trigger animation
        requestAnimationFrame(() => {
          // refresh xywh by model
          if (!this.lock) {
            this.page.captureSync();
            this.lock = true;
          }

          const newXywh = JSON.stringify([
            frameX,
            frameY,
            frameW,
            (frameBlock?.getBoundingClientRect().height || 0) / this.zoom +
              EDGELESS_BLOCK_CHILD_PADDING * 2,
          ]);
          this.page.updateBlock(element, { xywh: newXywh });
        });
      } else {
        this.surface.setElementBound(element.id, { x, y, w, h });
      }
    });
  };

  private _onDragEnd = () => {
    if (this.lock) {
      this.page.captureSync();
    }
    this.lock = false;
  };

  render() {
    if (this.state.selected.length === 0) return null;
    const { active } = this.state;

    const style = {
      border: `${
        this.state.active ? 2 : 1
      }px solid var(--affine-primary-color)`,
      ...getCommonRectStyle(this.rect, active, true),
    };
    const handlers = active
      ? null
      : getHandles(this.rect, this.resizeMode, this._dragManager.onMouseDown);
    return html`
      ${this.page.readonly ? null : handlers}
      <div class="affine-edgeless-selected-rect" style=${styleMap(style)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}
