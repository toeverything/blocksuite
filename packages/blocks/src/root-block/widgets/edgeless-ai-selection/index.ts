import { WidgetElement } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  MOUSE_BUTTON,
  on,
  requestConnectedFrame,
} from '../../../_common/utils/event.js';
import type { AIToolController } from '../../edgeless/controllers/tools/ai-tool.js';
import type { EdgelessRootBlockComponent } from '../../index.js';

export const AFFINE_EDGELESS_AI_WIDGET = 'affine-edgeless-ai-widget';

@customElement('affine-edgeless-ai-widget')
export class EdgelessAIWidget extends WidgetElement<EdgelessRootBlockComponent> {
  static override styles = css`
    .ai-selection-rect {
      position: absolute;
      box-sizing: border-box;
      border-radius: 4px;
      border: 2px dashed var(--affine-brand-color, #1e96eb);
    }
  `;

  @state()
  private _selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  @state()
  private _visible = false;

  private _clickOutsideOff: (() => void) | null = null;
  private _listenClickOutsideId: number | null = null;

  get edgeless() {
    return this.blockElement;
  }

  private _updateSelection(rect: DOMRect) {
    const zoom = this.edgeless.service.viewport.zoom;
    const [x, y] = this.edgeless.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    this._selectionRect = { x, y, width, height };
  }

  private _watchClickOutside() {
    this._clickOutsideOff?.();

    const { width, height } = this._selectionRect || {};

    if (width && height) {
      this._listenClickOutsideId &&
        cancelAnimationFrame(this._listenClickOutsideId);
      this._listenClickOutsideId = requestConnectedFrame(() => {
        if (!this.isConnected) {
          return;
        }

        const off = on(this.ownerDocument, 'mousedown', e => {
          if (
            e.button === MOUSE_BUTTON.MAIN &&
            !this.contains(e.target as HTMLElement)
          ) {
            off();
            this._visible = false;
          }
        });
        this._listenClickOutsideId = null;
        this._clickOutsideOff = off;
      }, this);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const AITool = this.edgeless.tools.controllers['ai'] as AIToolController;

    this._disposables.add(
      AITool.draggingAreaUpdated.on(() => {
        this._visible = true;
        this._updateSelection(AITool.area);
        this._watchClickOutside();
      })
    );

    this._disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this._updateSelection(AITool.area);
      })
    );
  }

  override render() {
    if (!this._visible) return nothing;

    const rect = this._selectionRect;

    return html`<div class="affine-edgeless-ai">
      ${rect?.width && rect?.height
        ? html`<div
            class="ai-selection-rect"
            style=${styleMap({
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            })}
          ></div>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_AI_WIDGET]: EdgelessAIWidget;
  }
}
