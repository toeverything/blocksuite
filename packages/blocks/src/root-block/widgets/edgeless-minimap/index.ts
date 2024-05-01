import { WidgetElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  on,
  once,
  requestConnectedFrame,
  stopPropagation,
} from '../../../_common/utils/event.js';
import { drawGeneralShape } from '../../../surface-block/canvas-renderer/element-renderer/shape/utils.js';
import { Bound, ShapeElementModel } from '../../../surface-block/index.js';
import { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { edgelessElementsBound } from '../../edgeless/utils/bound-utils.js';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 90;

export const AFFINE_EDGELESS_MINIMAP_WIDGET = 'affine-edgeless-minimap-widget';

@customElement(AFFINE_EDGELESS_MINIMAP_WIDGET)
export class AffineEdgelessMinimapWidget extends WidgetElement {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      left: 12px;
      bottom: 66px;

      z-index: 7;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--affine-border-color);
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);

      overflow: hidden;
      user-select: none;
    }

    canvas[aria-label='minimap'] {
      display: flex;
      flex: 1;
    }

    .slider {
      position: absolute;
      transform: translate3d(0px, 0px, 0px);
      background: rgba(100, 100, 100, 0.2);
      contain: strict;

      &:hover {
        background: rgba(100, 100, 100, 0.35);
      }

      &.active {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  `;

  get isEdgeless() {
    return this.blockElement instanceof EdgelessRootBlockComponent;
  }

  @query('canvas')
  canvas!: HTMLCanvasElement;

  @query('.slider')
  slider!: HTMLDivElement;

  @state()
  zoom: number = 1;

  @state()
  viewportBounds: Bound = new Bound();

  bounds: Bound = new Bound();

  width = DEFAULT_WIDTH;
  height = DEFAULT_HEIGHT;

  scale: number = 1;

  // Dragging slider
  dragging: boolean = false;

  private _shouldUpdate = false;

  private _updateScale() {
    const { width, height, blockElement } = this;
    const edgeless = blockElement as EdgelessRootBlockComponent;
    const elements = edgeless.service.edgelessElements;
    const bounds = edgelessElementsBound(elements);

    // @TODO(fundon): offset should be checked, prev bounds
    const scale = Math.min(
      width / (bounds.w || width),
      height / (bounds.h || height)
    );
    this.scale = scale;
    this.bounds = bounds;
  }

  private _render() {
    this._updateScale();

    const { bounds, blockElement, canvas, height, scale, width } = this;
    const edgeless = blockElement as EdgelessRootBlockComponent;
    const elements = edgeless.service.edgelessElements;
    const renderer = edgeless.surface.renderer;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    const dpr = window.devicePixelRatio;
    const matrix = new DOMMatrix()
      .scaleSelf(dpr)
      .scaleSelf(scale)
      .translateSelf(
        -bounds.x + (width / scale - bounds.w) / 2,
        -bounds.y + (height / scale - bounds.h) / 2
      );

    ctx.setTransform(matrix);

    elements.forEach(element => {
      ctx.save();

      if (element instanceof ShapeElementModel) {
        const display = element.display ?? true;
        if (!display) return;

        const opacity = element.opacity ?? 1;
        ctx.globalAlpha = opacity;

        const { x, y, w, h, strokeWidth } = element;
        const renderOffset = Math.max(strokeWidth, 0) / 2;
        const renderWidth = Math.max(0, w - renderOffset * 2);
        const renderHeight = Math.max(0, h - renderOffset * 2);
        const cx = renderWidth / 2;
        const cy = renderHeight / 2;

        ctx.setTransform(
          matrix
            .translate(x, y)
            .translateSelf(cx, cy)
            .rotateSelf(element.rotate)
            .translateSelf(-cx, -cy)
        );
        drawGeneralShape(ctx, element, renderer);
      } else {
        const { x, y, w, h } = element.elementBound;
        ctx.setTransform(matrix.translate(x, y));

        ctx.fillStyle = 'rgba(127.5, 127.5, 127.5, 0.6)';
        ctx.fillRect(0, 0, w, h);
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }

  private _loop() {
    requestConnectedFrame(() => {
      if (this._shouldUpdate) {
        this._render();
        this._shouldUpdate = false;
      }
      this._loop();
    }, this);
  }

  override firstUpdated() {
    if (!this.isEdgeless) return;

    const dpr = window.devicePixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    const edgeless = this.blockElement as EdgelessRootBlockComponent;

    this.disposables.add(
      edgeless.service.viewport.sizeUpdated.on(rect => {
        this._updateScale();
        // const { height, width, scale, viewportBounds } = this;
        const { scale, viewportBounds } = this;

        viewportBounds.w = scale * rect.width;
        viewportBounds.h = scale * rect.height;

        // if (
        //   viewportBounds.w * (1 / this.zoom) > width ||
        //   viewportBounds.h * (1 / this.zoom) > height
        // ) {
        //   const p = viewportBounds.w / viewportBounds.h;
        //   const ws = viewportBounds.w / width;
        //   const hs = viewportBounds.h / height;
        //   if (ws > hs) {
        //     viewportBounds.w = width * this.zoom;
        //     viewportBounds.h = (width * this.zoom) / p;
        //   } else if (ws < hs) {
        //     viewportBounds.h = height * this.zoom;
        //     viewportBounds.w = height * this.zoom * p;
        //   } else {
        //     if (p > 1) {
        //       viewportBounds.w = width * this.zoom;
        //       viewportBounds.h = (width * this.zoom) / p;
        //     } else {
        //       viewportBounds.h = height * this.zoom;
        //       viewportBounds.w = height * this.zoom * p;
        //     }
        //   }
        //   console.log(this.scale);
        //   // this.scale = viewportBounds.w / rect.width;
        // }

        this._shouldUpdate = true;
        this.requestUpdate();
      })
    );
    this.disposables.add(
      edgeless.service.viewport.viewportUpdated.on(({ zoom, center }) => {
        if (this.dragging) return;

        const { bounds, height, scale, width, viewportBounds } = this;
        const x = (width - viewportBounds.w) / 2;
        const y = (height - viewportBounds.h) / 2;
        const dx = center[0] - bounds.w / 2 - bounds.x;
        const dy = center[1] - bounds.h / 2 - bounds.y;

        // if (dx < 0) {
        //   bounds.x += dx;
        // }
        // bounds.w += Math.abs(dx);
        // if (dy < 0) {
        //   bounds.y += dy;
        // }
        // bounds.h += Math.abs(dy);

        viewportBounds.x = x + dx * scale;
        viewportBounds.y = y + dy * scale;
        this.zoom = zoom;
        this._shouldUpdate = true;
        this.requestUpdate();
      })
    );

    /*
      this.disposables.add(
        edgeless.service.viewport.viewportMoved.on(delta => {
          if (this.dragging) return;

          this.viewportBounds.x += delta[0] * this.scale;
          this.viewportBounds.y += delta[1] * this.scale;

          this.requestUpdate();
        })
      );
      */

    this.disposables.addFromEvent(this, 'pointerdown', stopPropagation);
    // this.disposables.addFromEvent(this, 'wheel', stopPropagation);
    this.disposables.addFromEvent(this.canvas, 'click', (e: MouseEvent) => {
      e.stopPropagation();

      const { clientX, clientY } = e;
      const { canvas, viewportBounds } = this;
      const box = canvas.getBoundingClientRect();
      const x = clientX - box.left - viewportBounds.w / 2;
      const y = clientY - box.top - viewportBounds.h / 2;
      const dx = x - viewportBounds.x;
      const dy = y - viewportBounds.y;

      this.viewportBounds.x = x;
      this.viewportBounds.y = y;
      this.requestUpdate();

      edgeless.service.viewport.applyDeltaCenter(
        dx / this.scale,
        dy / this.scale
      );
    });
    this.disposables.addFromEvent(
      this.slider,
      'pointerdown',
      (e: PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();

        this.slider.classList.add('active');

        const point = [e.clientX, e.clientY];
        const stopDragging = on(
          this.slider.ownerDocument,
          'pointermove',
          (e: PointerEvent) => {
            e.stopPropagation();
            this.dragging = true;

            const { clientX, clientY } = e;
            const dx = clientX - point[0];
            const dy = clientY - point[1];

            point[0] = clientX;
            point[1] = clientY;

            this.viewportBounds.x += dx;
            this.viewportBounds.y += dy;
            this.requestUpdate();

            edgeless.service.viewport.applyDeltaCenter(
              dx / this.scale,
              dy / this.scale
            );
          }
        );

        once(
          this.slider.ownerDocument,
          'pointerup',
          (e: PointerEvent) => {
            e.stopPropagation();
            stopDragging();
            this.dragging = false;
            this.slider.classList.remove('active');
          },
          false
        );
      }
    );

    this.disposables.add(
      edgeless.surfaceBlockModel.elementAdded.on(() => {
        this._shouldUpdate = true;
      })
    );
    this.disposables.add(
      edgeless.surfaceBlockModel.elementRemoved.on(() => {
        this._shouldUpdate = true;
      })
    );
    this.disposables.add(
      edgeless.surfaceBlockModel.elementUpdated.on(() => {
        this._shouldUpdate = true;
      })
    );
    this.disposables.add(
      edgeless.doc.slots.blockUpdated.on(() => {
        this._shouldUpdate = true;
      })
    );

    this._loop();
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disposables.dispose();
  }

  override render() {
    const { viewportBounds, zoom } = this;

    return html`<canvas aria-label="minimap"></canvas>
      <div
        class="slider"
        style=${styleMap({
          width: `${viewportBounds.w}px`,
          height: `${viewportBounds.h}px`,
          transform: `translate3d(${viewportBounds.x}px,${viewportBounds.y}px, 0px) scale(${1 / zoom})`,
        })}
      ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_MINIMAP_WIDGET]: AffineEdgelessMinimapWidget;
  }
}
