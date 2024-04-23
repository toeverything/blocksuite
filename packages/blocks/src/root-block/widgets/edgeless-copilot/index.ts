import { WidgetElement } from '@blocksuite/block-std';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import {
  MOUSE_BUTTON,
  requestConnectedFrame,
} from '../../../_common/utils/event.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { type RootBlockModel } from '../../root-model.js';
import type { AffineAIPanelWidget } from '../ai-panel/ai-panel.js';
import { AFFINE_AI_PANEL_WIDGET } from '../ai-panel/ai-panel.js';
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
  } = { x: 0, y: 0, width: 0, height: 0 };

  @state()
  private _visible = false;

  @query('.copilot-selection-rect')
  selectionElem!: HTMLDivElement;

  private _selectionModelRect!: DOMRect;

  private _clickOutsideOff: (() => void) | null = null;
  private _listenClickOutsideId: number | null = null;

  private _copilotPanel!: EdgelessCopilotPanel | null;

  groups: AIItemGroupConfig[] = [];

  get visible() {
    return !!(
      this._visible &&
      this._selectionRect.width &&
      this._selectionRect.height
    );
  }

  get selectionRect() {
    return this._selectionRect;
  }

  get selectionModelRect() {
    return this._selectionModelRect;
  }

  get edgeless() {
    return this.blockElement;
  }

  set visible(visible: boolean) {
    this._visible = visible;
  }

  hideCopilotPanel() {
    this._copilotPanel?.hide();
    this._copilotPanel = null;
    this._clickOutsideOff = null;
  }

  lockToolbar(disabled: boolean) {
    this.edgeless.slots.toolbarLocked.emit(disabled);
  }

  private _updateSelection(rect: DOMRect) {
    this._selectionModelRect = rect;

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

    const { width, height } = this._selectionRect;

    if (width && height) {
      this._listenClickOutsideId &&
        cancelAnimationFrame(this._listenClickOutsideId);
      this._listenClickOutsideId = requestConnectedFrame(() => {
        if (!this.isConnected) {
          return;
        }

        const off = this.blockElement.dispatcher.add('pointerDown', ctx => {
          const e = ctx.get('pointerState').raw;
          const aiPanel = this.host.view.getWidget(
            AFFINE_AI_PANEL_WIDGET,
            this.doc.root!.id
          ) as AffineAIPanelWidget;

          if (
            e.button === MOUSE_BUTTON.MAIN &&
            !this.contains(e.target as HTMLElement) &&
            (!aiPanel || aiPanel.state === 'hidden')
          ) {
            off();
            this._visible = false;
            this.hideCopilotPanel();
          }
        });
        this._listenClickOutsideId = null;
        this._clickOutsideOff = off;
      }, this);
    }
  }

  private _showCopilotPanel() {
    requestConnectedFrame(() => {
      if (!this._copilotPanel) {
        const panel = new EdgelessCopilotPanel();
        panel.host = this.host;
        panel.groups = this.groups;
        panel.edgeless = this.edgeless;
        this.renderRoot.append(panel);
        this._copilotPanel = panel;
      }

      const referenceElement = this.selectionElem;
      const panel = this._copilotPanel;
      // @TODO: optimize
      const viewport = this.edgeless.service.viewport;

      if (!referenceElement || !referenceElement.isConnected) return;

      autoUpdate(referenceElement, panel, () => {
        computePosition(referenceElement, panel, {
          placement: 'right-start',
          middleware: [
            offset({
              mainAxis: 16,
            }),
            shift(() => {
              const { width, height } = viewport;
              return {
                padding: 20,
                crossAxis: true,
                boundary: {
                  x: 20,
                  y: 50,
                  width: width - 40,
                  height: height - 120,
                },
              };
            }),
            flip({
              crossAxis: true,
            }),
            size({
              apply: ({ elements }) => {
                const { height } = viewport;
                elements.floating.style.maxHeight = `${height - 120}px`;
              },
            }),
          ],
        })
          .then(({ x, y }) => {
            panel.style.left = `${x}px`;
            panel.style.top = `${y}px`;
          })
          .catch(e => {
            console.warn("Can't compute EdgelessCopilotPanel position", e);
          });
      });
    }, this);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const CopilotSelectionTool = this.edgeless.tools.controllers[
      'copilot'
    ] as CopilotSelectionController;

    this._disposables.add(
      CopilotSelectionTool.draggingAreaUpdated.on(shouldShowPanel => {
        this._visible = true;
        this._updateSelection(CopilotSelectionTool.area);
        if (shouldShowPanel) {
          this._showCopilotPanel();
          this._watchClickOutside();
        } else {
          this.hideCopilotPanel();
        }
      })
    );

    this._disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this._updateSelection(CopilotSelectionTool.area);
      })
    );

    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(({ type }) => {
        if (type !== 'copilot') {
          this._visible = false;
          this._clickOutsideOff = null;
          this._copilotPanel?.remove();
          this._copilotPanel = null;
        }
      })
    );
  }

  override render() {
    if (!this._visible) return nothing;

    const rect = this._selectionRect;

    return html`<div class="affine-edgeless-ai">
      <div
        class="copilot-selection-rect"
        style=${styleMap({
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        })}
      ></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_COPILOT_WIDGET]: EdgelessCopilotWidget;
  }
}
