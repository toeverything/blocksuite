import '../tool-icon-button.js';
import '../../toolbar/brush-tool/color-panel.js';

import { ConnectorLIcon, ConnectorXIcon } from '@blocksuite/global/config';
import type {
  Color,
  ConnectorElement,
  SurfaceManager,
} from '@blocksuite/phasor';
import { getBrushBoundFromPoints } from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type {
  ColorEvent,
  EdgelessColorPanel,
} from '../../toolbar/brush-tool/color-panel.js';
import {
  generateConnectorPath,
  getConnectorAttachedInfo,
} from '../../utils.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(elements: ConnectorElement[]): Color | undefined {
  const colors = countBy(elements, (ele: ConnectorElement) => ele.color);
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as Color) : undefined;
}

function getMostCommonMode(
  elements: ConnectorElement[]
): ConnectorMode | undefined {
  const modes = countBy(elements, (ele: ConnectorElement) => ele.mode);
  const max = maxBy(Object.entries(modes), ([k, count]) => count);
  return max ? (Number(max[0]) as ConnectorMode) : undefined;
}

@customElement('edgeless-change-connector-button')
export class EdgelessChangeConnectorButton extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      fill: none;
      stroke: none;
      color: var(--affine-text-primary-color);
    }

    menu-divider {
      height: 24px;
    }

    .color-panel-container {
      display: none;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-white-90);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
    }

    .color-panel-container[data-show] {
      display: block;
    }

    .connector-mode-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .connector-mode-button[active] {
      background-color: var(--affine-hover-color);
    }

    .connector-color-button .color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
  `;

  @property()
  elements: ConnectorElement[] = [];

  @property({ type: Object })
  selectionState!: EdgelessSelectionState;

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @property()
  slots!: EdgelessSelectionSlots;

  @query('.color-panel-container')
  private _colorPanel!: EdgelessColorPanel;

  private _colorPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _disposables: DisposableGroup = new DisposableGroup();

  private _setConnectorMode(mode: ConnectorMode) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.mode !== mode) {
        if (element.mode === ConnectorMode.Orthogonal) {
          const controllers = [
            element.controllers[0],
            element.controllers[element.controllers.length - 1],
          ];
          const bound = getBrushBoundFromPoints(
            controllers.map(c => [c.x + element.x, c.y + element.y]),
            0
          );
          this.surface.updateConnectorElement(element.id, bound, controllers, {
            mode,
          });
        } else {
          const { start, end } = getConnectorAttachedInfo(
            element,
            this.surface,
            this.page
          );
          const route = generateConnectorPath(
            start.rect,
            end.rect,
            start.point,
            end.point,
            []
          );
          const bound = getBrushBoundFromPoints(
            route.map(r => [r.x, r.y]),
            0
          );
          const controllers = route.map(r => {
            return {
              ...r,
              x: r.x - bound.x,
              y: r.y - bound.y,
            };
          });
          this.surface.updateConnectorElement(element.id, bound, controllers, {
            mode,
          });
        }
      }
    });
    // FIXME: force update selection, because connector mode changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setConnectorColor(color: Color) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.color !== color) {
        this.surface.updateElementProps(element.id, { color });
      }
    });
  }

  firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorPanelPopper = createButtonPopper(this, this._colorPanel);
    _disposables.add(this._colorPanelPopper);
    super.firstUpdated(changedProperties);
  }

  render() {
    const selectedColor = getMostCommonColor(this.elements);
    const style = {
      backgroundColor: selectedColor ?? '#fff',
    };

    const selectedMode = getMostCommonMode(this.elements);

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Straight line'}
        @tool.click=${() => this._setConnectorMode(ConnectorMode.Straight)}
      >
        <div
          class="connector-mode-button"
          ?active=${selectedMode === ConnectorMode.Straight}
        >
          ${ConnectorLIcon}
        </div>
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Connector'}
        @tool.click=${() => this._setConnectorMode(ConnectorMode.Orthogonal)}
      >
        <div
          class="connector-mode-button"
          ?active=${selectedMode === ConnectorMode.Orthogonal}
        >
          ${ConnectorXIcon}
        </div>
      </edgeless-tool-icon-button>
      <menu-divider .vertical=${true}></menu-divider>
      <edgeless-tool-icon-button
        .tooltip=${'Color'}
        .active=${false}
        @tool.click=${() => this._colorPanelPopper?.toggle()}
      >
        <div class="connector-color-button">
          <div class="color" style=${styleMap(style)}></div>
        </div>
      </edgeless-tool-icon-button>
      <div class="color-panel-container">
        <edgeless-color-panel
          .value=${selectedColor}
          @select=${(e: ColorEvent) => this._setConnectorColor(e.detail)}
        >
        </edgeless-color-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-connector-button': EdgelessChangeConnectorButton;
  }
}
