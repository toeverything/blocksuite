import type { RootBlockModel } from '@blocksuite/affine-model';

import {
  MOUSE_BUTTON,
  requestConnectedFrame,
} from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { Bound, getElementsBound } from '@blocksuite/global/utils';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { CopilotSelectionController } from '../../edgeless/tools/copilot-tool.js';
import type { AffineAIPanelWidget } from '../ai-panel/ai-panel.js';

import { AFFINE_AI_PANEL_WIDGET } from '../ai-panel/ai-panel.js';
import { EdgelessCopilotPanel } from '../edgeless-copilot-panel/index.js';

export const AFFINE_EDGELESS_COPILOT_WIDGET = 'affine-edgeless-copilot-widget';

export class EdgelessCopilotWidget extends WidgetComponent<
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

  private _clickOutsideOff: (() => void) | null = null;

  private _copilotPanel!: EdgelessCopilotPanel | null;

  private _listenClickOutsideId: number | null = null;

  private _selectionModelRect!: DOMRect;

  groups: AIItemGroupConfig[] = [];

  get edgeless() {
    return this.block;
  }

  get selectionModelRect() {
    return this._selectionModelRect;
  }

  get selectionRect() {
    return this._selectionRect;
  }

  get visible() {
    return !!(
      this._visible &&
      this._selectionRect.width &&
      this._selectionRect.height
    );
  }

  set visible(visible: boolean) {
    this._visible = visible;
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
            flip({
              mainAxis: true,
              crossAxis: true,
              flipAlignment: true,
            }),
            shift(() => {
              const { left, top, width, height } = viewport;
              return {
                padding: 20,
                crossAxis: true,
                rootBoundary: {
                  x: left,
                  y: top,
                  width,
                  height: height - 100,
                },
              };
            }),
            size({
              apply: ({ elements }) => {
                const { height } = viewport;
                elements.floating.style.maxHeight = `${height - 140}px`;
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

        const off = this.block.dispatcher.add('pointerDown', ctx => {
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
        if (!this._visible) return;

        this._updateSelection(CopilotSelectionTool.area);
      })
    );

    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(({ type }) => {
        if (!this._visible || type === 'copilot') return;

        this._visible = false;
        this._clickOutsideOff = null;
        this._copilotPanel?.remove();
        this._copilotPanel = null;
      })
    );
  }

  determineInsertionBounds(width = 800, height = 95) {
    const elements = this.edgeless.service.selection.selectedElements;
    const offsetY = 20 / this.edgeless.service.viewport.zoom;
    const bounds = new Bound(0, 0, width, height);
    if (elements.length) {
      const { x, y, h } = getElementsBound(
        elements.map(ele => ele.elementBound)
      );
      bounds.x = x;
      bounds.y = y + h + offsetY;
    } else {
      const { x, y, height: h } = this.selectionModelRect;
      bounds.x = x;
      bounds.y = y + h + offsetY;
    }
    return bounds;
  }

  hideCopilotPanel() {
    this._copilotPanel?.hide();
    this._copilotPanel = null;
    this._clickOutsideOff = null;
  }

  lockToolbar(disabled: boolean) {
    this.edgeless.slots.toolbarLocked.emit(disabled);
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

  @state()
  private accessor _selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  @state()
  private accessor _visible = false;

  @query('.copilot-selection-rect')
  accessor selectionElem!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_COPILOT_WIDGET]: EdgelessCopilotWidget;
  }
}
