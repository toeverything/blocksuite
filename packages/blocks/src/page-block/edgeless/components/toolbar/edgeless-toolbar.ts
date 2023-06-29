import '../buttons/tool-icon-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './shape/shape-tool-button.js';

import {
  EraserIcon,
  HandIcon,
  ImageIcon,
  MinusIcon,
  NoteIcon,
  PlusIcon,
  SelectIcon,
  TextIconLarge,
  ViewBarIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { clamp } from '../../../../__internal__/utils/common.js';
import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { uploadImageFromLocal } from '../../../../__internal__/utils/filesys.js';
import { Point } from '../../../../__internal__/utils/rect.js';
import type { EdgelessTool } from '../../../../__internal__/utils/types.js';
import { DEFAULT_NOTE_COLOR } from '../../../../note-block/note-model.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getTooltipWithShortcut } from '../utils.js';

export type ZoomAction = 'fit' | 'out' | 'reset' | 'in';

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
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

  edgeless: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  get zoom() {
    return this.edgeless.surface.viewport.zoom;
  }

  private _imageLoading = false;
  private _rafId: number | null = null;

  private _setCenter(x: number, y: number) {
    this.edgeless.surface.viewport.setCenter(x, y);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _setZoom(zoom: number, focusPoint?: Point) {
    this.edgeless.surface.viewport.setZoom(zoom, focusPoint);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _setZoomByStep(step: number) {
    this._smoothZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  private _smoothZoom(zoom: number, focusPoint?: Point) {
    const delta = zoom - this.zoom;

    const innerSmoothZoom = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        const sign = delta > 0 ? 1 : -1;
        const total = 10;
        const step = delta / total;
        const nextZoom = this._cutoff(this.zoom + step, zoom, sign);

        this._setZoom(nextZoom, focusPoint);
        if (nextZoom != zoom) innerSmoothZoom();
      });
    };
    innerSmoothZoom();
  }

  private _cutoff(value: number, ref: number, sign: number) {
    if (sign > 0 && value > ref) return ref;
    if (sign < 0 && value < ref) return ref;
    return value;
  }

  private _zoomToFit() {
    const { centerX, centerY, zoom } = this.edgeless.getFitToScreenData();
    const { viewport } = this.edgeless.surface;
    const preZoom = this.zoom;
    const newZoom = zoom;
    const cofficient = preZoom / newZoom;
    if (cofficient === 1) {
      this._smoothTranslate(centerX, centerY);
    } else {
      const center = new Point(viewport.centerX, viewport.centerY);
      const newCenter = new Point(centerX, centerY);
      const focusPoint = newCenter
        .subtract(center.scale(cofficient))
        .scale(1 / (1 - cofficient));
      this._smoothZoom(zoom, focusPoint);
    }
  }

  private _smoothTranslate(x: number, y: number) {
    const { viewport } = this.edgeless.surface;
    const delta = { x: x - viewport.centerX, y: y - viewport.centerY };
    const innerSmoothTranslate = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        const rate = 10;
        const step = { x: delta.x / rate, y: delta.y / rate };
        const nextCenter = {
          x: viewport.centerX + step.x,
          y: viewport.centerY + step.y,
        };
        const signX = delta.x > 0 ? 1 : -1;
        const signY = delta.y > 0 ? 1 : -1;
        nextCenter.x = this._cutoff(nextCenter.x, x, signX);
        nextCenter.y = this._cutoff(nextCenter.y, y, signY);
        this._setCenter(nextCenter.x, nextCenter.y);
        if (nextCenter.x != x || nextCenter.y != y) innerSmoothTranslate();
      });
    };
    innerSmoothTranslate();
  }

  private async _addImage() {
    this._imageLoading = true;

    const models = await uploadImageFromLocal(this.edgeless.page.blobs);

    if (!models.length) {
      this._imageLoading = false;
      return;
    }

    const notes = models.map(model => this.edgeless.addImage(model));
    const { noteId } = notes[notes.length - 1];

    const note = this.edgeless.notes.find(note => note.id === noteId);
    assertExists(note);

    this.edgeless.selection.switchToDefaultMode({
      selected: [note],
      active: false,
    });

    this._imageLoading = false;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.selection.setEdgelessTool(edgelessTool);
  };

  setZoomByAction(action: ZoomAction) {
    switch (action) {
      case 'fit':
        this._zoomToFit();
        break;
      case 'reset':
        this._smoothZoom(1.0);
        break;
      case 'in':
      case 'out':
        this._setZoomByStep(ZOOM_STEP * (action === 'in' ? 1 : -1));
    }
  }

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(
      slots.edgelessToolUpdated.on(() => {
        this._trySaveBrushStateLocalRecord();
        this.requestUpdate();
      })
    );
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
  }

  private _trySaveBrushStateLocalRecord = () => {
    const edgelessTool = this.edgeless.selection.edgelessTool;
    if (edgelessTool.type === 'brush') {
      sessionStorage.setItem(
        'blocksuite:' + this.edgeless.page.id + ':edgelessBrush',
        JSON.stringify({
          color: edgelessTool.color,
          lineWidth: edgelessTool.lineWidth,
        })
      );
    }
  };

  override render() {
    const { type } = this.edgelessTool;
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
          @click=${() => this.setEdgelessTool({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Text', 'T')}
          .active=${type === 'text'}
          @click=${() => this.setEdgelessTool({ type: 'text' })}
        >
          ${TextIconLarge}
        </edgeless-tool-icon-button>
        <edgeless-shape-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-shape-tool-button>
        <edgeless-tool-icon-button
          .disabled=${this._imageLoading}
          .tooltip=${'Image'}
          @click=${() => this._addImage()}
        >
          ${ImageIcon}
        </edgeless-tool-icon-button>
        <edgeless-connector-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-connector-tool-button>
        <edgeless-brush-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-brush-tool-button>

        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
          .active=${type === 'eraser'}
          @click=${() => this.setEdgelessTool({ type: 'eraser' })}
        >
          ${EraserIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          @click=${() => this.setEdgelessTool({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Note', 'N')}
          .active=${type === 'note'}
          @click=${() =>
            this.setEdgelessTool({
              type: 'note',
              background: DEFAULT_NOTE_COLOR,
            })}
        >
          ${NoteIcon}
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
        <span class="zoom-percent" @click=${() => this._smoothZoom(1)}>
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
