import { WidgetElement } from '@blocksuite/block-std';
import { autoUpdate, computePosition, offset, shift } from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import {
  MOUSE_BUTTON,
  on,
  once,
  requestConnectedFrame,
} from '../../../_common/utils/event.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { RootBlockModel } from '../../index.js';
import { actionWithAI, dragWithAI } from '../edgeless-copilot-panel/config.js';
import { EdgelessCopilotPanel } from '../edgeless-copilot-panel/index.js';

export const AFFINE_EDGELESS_COPILOT_WIDGET = 'affine-edgeless-copilot-widget';

@customElement(AFFINE_EDGELESS_COPILOT_WIDGET)
export class EdgelessCopilotWidget extends WidgetElement<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    .copilot-selection-rect {
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

  @query('.copilot-selection-rect')
  private _selectionRectEl!: HTMLDivElement;

  private _clickOutsideOff: (() => void) | null = null;
  private _listenClickOutsideId: number | null = null;

  private _copilotPanel!: EdgelessCopilotPanel | null;
  private _showCopilotPanelOff: (() => void) | null = null;

  groups: AIItemGroupConfig[] = [actionWithAI, dragWithAI];

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
            this._copilotPanel?.remove();
            this._visible = false;
            this._clickOutsideOff = null;
          }
        });
        this._listenClickOutsideId = null;
        this._clickOutsideOff = off;
      }, this);
    }
  }

  private _showCopilotPanel() {
    this._showCopilotPanelOff?.();
    this._showCopilotPanelOff = once(this.ownerDocument, 'pointerup', () => {
      if (!this._selectionRectEl) {
        return;
      }

      const panel = new EdgelessCopilotPanel();
      const referenceElement = this._selectionRectEl;
      panel.host = this.host;
      panel.groups = this.groups;
      panel.edgeless = this.edgeless;
      this.renderRoot.append(panel);
      this._copilotPanel = panel;

      requestConnectedFrame(() => {
        if (!referenceElement.isConnected) return;

        autoUpdate(referenceElement, panel, () => {
          computePosition(referenceElement, panel, {
            placement: 'right-start',
            middleware: [offset({ mainAxis: 15, crossAxis: -60 }), shift()],
          })
            .then(({ x, y }) => {
              panel.style.left = `${x}px`;
              panel.style.top = `${y}px`;
              panel.style.position = 'absolute';
            })
            .catch(e => {
              console.warn("Can't compute EdgelessCopilotPanel position", e);
            });
        });
      }, this);
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const CopilotSelectionTool = this.edgeless.tools.controllers[
      'copilot'
    ] as CopilotSelectionController;

    this._disposables.add(
      CopilotSelectionTool.draggingAreaUpdated.on(() => {
        this._visible = true;
        this._updateSelection(CopilotSelectionTool.area);
        this._showCopilotPanel();
        this._watchClickOutside();
      })
    );

    this._disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this._updateSelection(CopilotSelectionTool.area);
      })
    );
  }

  override render() {
    if (!this._visible) return nothing;

    const rect = this._selectionRect;

    return html`<div class="affine-edgeless-ai">
      ${rect?.width && rect?.height
        ? html`<div
            class="copilot-selection-rect"
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
    [AFFINE_EDGELESS_COPILOT_WIDGET]: EdgelessCopilotWidget;
  }
}
