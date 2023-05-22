import '../components/tool-icon-button.js';
import './shape-tool/shape-tool-button.js';
import './brush-tool/brush-tool-button.js';
import './connector-tool/connector-tool-button.js';

import {
  FRAME_BACKGROUND_COLORS,
  HandIcon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  SelectIcon,
  TextIconLarge,
  ViewBarIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import {
  Bound,
  deserializeXYWH,
  getCommonBound,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  clamp,
  type MouseMode,
  Point,
  uploadImageFromLocal,
} from '../../../__internal__/index.js';
import { getTooltipWithShortcut } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { stopPropagation } from '../utils.js';

const FIT_TO_SCREEN_PADDING = 200;

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 2;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      justify-content: center;
      transform: translateX(-50%);
      user-select: none;
    }

    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      fill: currentcolor;
    }

    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }

    .edgeless-toolbar-container[hidden] {
      display: none;
    }

    .divider {
      width: 1px;
      height: 24px;
      margin: 0 7px;
      background-color: var(--affine-border-color);
    }

    .zoom-percent {
      display: block;
      box-sizing: border-box;
      width: 48px;
      height: 32px;
      line-height: 22px;
      padding: 5px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      color: var(--affine-icon-color);
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  zoom!: number;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _imageLoading = false;

  private _setMouseMode(mouseMode: MouseMode) {
    this.edgeless?.slots.mouseModeUpdated.emit(mouseMode);
  }

  private _setZoom(zoom: number) {
    const { viewport } = this.edgeless.surface;
    viewport.setZoom(zoom);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _setZoomByStep(step: number) {
    this._setZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  private _zoomToFit() {
    const bounds = [];

    const frame = this.edgeless.frames[0];
    if (frame) {
      const frameXYWH = deserializeXYWH(frame.xywh);
      const frameBound = new Bound(...frameXYWH);
      bounds.push(frameBound);
    }

    const surfaceElementsBound = this.edgeless.surface.getElementsBound();
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    const { viewport } = this.edgeless.surface;
    let { centerX, centerY, zoom } = viewport;

    if (bounds.length) {
      const { width, height } = viewport;
      const bound = getCommonBound(bounds);
      assertExists(bound);

      zoom = Math.min(
        (width - FIT_TO_SCREEN_PADDING) / bound.w,
        (height - FIT_TO_SCREEN_PADDING) / bound.h
      );

      centerX = bound.x + bound.w / 2;
      centerY = bound.y + bound.h / 2;
    } else {
      zoom = 1;
    }

    viewport.setZoom(zoom);
    viewport.setCenter(centerX, centerY);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private async _addImage() {
    this._imageLoading = true;
    const options = {
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
    };

    const models = await uploadImageFromLocal(this.edgeless.page, realSize =>
      Object.assign(options, realSize)
    );

    const { left, width, top, height } =
      this.edgeless.pageBlockContainer.getBoundingClientRect();

    if (options.width && options.height) {
      const s = width / height;
      const sh = height > 100 ? height - 100 : height;
      const p = options.width / options.height;
      if (s >= 1) {
        options.height =
          options.height > sh ? sh : Math.min(options.height, sh);
        options.width = p * options.height;
      } else {
        const sw = sh * s;
        options.width = options.width > sw ? sw : Math.min(options.width, sw);
        options.height = options.width / p;
      }
    }

    const { zoom } = this.edgeless.surface.viewport;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    let x = 0;
    let y = 0;
    if (zoom > 1) {
      x = centerX - options.width / 2;
      y = centerY - options.height / 2;
      options.width /= zoom;
      options.height /= zoom;
    } else {
      x = centerX - (options.width * zoom) / 2;
      y = centerY - (options.height * zoom) / 2;
    }

    this.edgeless.addNewFrame(models, new Point(x, y), options);
    this._imageLoading = false;
  }

  override render() {
    const type = this.mouseMode?.type;
    const formattedZoom = `${Math.round(this.zoom * 100)}%`;

    return html`
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          @click=${() => this._setMouseMode({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Text', 'T')}
          .active=${type === 'text'}
          @click=${() =>
            this._setMouseMode({
              type: 'text',
              background: FRAME_BACKGROUND_COLORS[0],
            })}
        >
          ${TextIconLarge}
        </edgeless-tool-icon-button>
        <edgeless-shape-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
        ></edgeless-shape-tool-button>
        <edgeless-tool-icon-button
          .disabled=${this._imageLoading}
          .tooltip=${'Image'}
          @click=${() => this._addImage()}
        >
          ${ImageIcon}
        </edgeless-tool-icon-button>
        <edgeless-connector-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
        ></edgeless-connector-tool-button>
        <edgeless-brush-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
        ></edgeless-brush-tool-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          @click=${() => this._setMouseMode({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
        <div class="divider"></div>
        <edgeless-tool-icon-button
          .tooltip=${'Fit to screen'}
          @click=${() => this._zoomToFit()}
        >
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom out'}
          @click=${() => this._setZoomByStep(-ZOOM_STEP)}
        >
          ${MinusIcon}
        </edgeless-tool-icon-button>
        <span class="zoom-percent" @click=${() => this._setZoom(1)}>
          ${formattedZoom}
        </span>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom in'}
          @click=${() => this._setZoomByStep(ZOOM_STEP)}
        >
          ${PlusIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolbar;
  }
}
