import '../tool-icon-button.js';
import '../color-panel.js';

import {
  ConnectorLIcon,
  ConnectorXIcon,
  LineStyleIcon,
} from '@blocksuite/global/config';
import type { ConnectorElement, SurfaceManager } from '@blocksuite/phasor';
import { StrokeStyle } from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import {
  generateConnectorPath,
  getConnectorAttachedInfo,
} from '../../utils.js';
import {
  type ColorEvent,
  DEFAULT_LINE_COLOR,
  type EdgelessColorPanel,
} from '../color-panel.js';
import type { LineSizeButtonProps } from '../line-size-button.js';
import { lineSizeButtonStyles } from '../line-size-button.js';
import type { LineStyleButtonProps } from '../line-style-button.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../line-styles-panel.js';
import type { EdgelessToolIconButton } from '../tool-icon-button.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(
  elements: ConnectorElement[]
): CssVariableName | null {
  const colors = countBy(elements, (ele: ConnectorElement) => ele.color);
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as CssVariableName) : DEFAULT_LINE_COLOR;
}

function getMostCommonMode(elements: ConnectorElement[]): ConnectorMode | null {
  const modes = countBy(elements, (ele: ConnectorElement) => ele.mode);
  const max = maxBy(Object.entries(modes), ([k, count]) => count);
  return max ? (Number(max[0]) as ConnectorMode) : null;
}

function getMostCommonLineWidth(
  elements: ConnectorElement[]
): LineSizeButtonProps['size'] | null {
  const sizes = countBy(elements, (ele: ConnectorElement) => {
    return ele.lineWidth === 4 ? 's' : 'l';
  });
  const max = maxBy(Object.entries(sizes), ([k, count]) => count);
  return max ? (max[0] as LineSizeButtonProps['size']) : null;
}

function getMostCommonLineStyle(
  elements: ConnectorElement[]
): LineStyleButtonProps['mode'] | null {
  const sizes = countBy(elements, (ele: ConnectorElement) => {
    switch (ele.strokeStyle) {
      case StrokeStyle.Solid: {
        return 'solid';
      }
      case StrokeStyle.Dashed: {
        return 'dash';
      }
      case StrokeStyle.None: {
        return 'none';
      }
    }
  });
  const max = maxBy(Object.entries(sizes), ([k, count]) => count);
  return max ? (max[0] as LineStyleButtonProps['mode']) : null;
}

@customElement('edgeless-change-connector-button')
export class EdgelessChangeConnectorButton extends LitElement {
  static override styles = [
    lineSizeButtonStyles,
    lineStylesPanelStyles,
    css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-primary-color);
        fill: currentColor;
      }

      menu-divider {
        height: 24px;
      }

      .color-panel-container {
        display: none;
        padding: 4px;
        justify-content: center;
        align-items: center;
        background: var(--affine-background-overlay-panel-color);
        box-shadow: var(--affine-shadow-2);
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

      .line-style-panel {
        display: none;
      }
      .line-style-panel[data-show] {
        display: flex;
      }
    `,
  ];

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

  @query('.connector-color-button')
  private _colorButton!: EdgelessToolIconButton;
  @query('.color-panel-container')
  private _colorPanel!: EdgelessColorPanel;
  private _colorPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _disposables: DisposableGroup = new DisposableGroup();

  @query('.line-styles-button')
  private _lineStylesButton!: EdgelessToolIconButton;
  @query('.line-style-panel')
  private _lineStylesPanel!: HTMLDivElement;
  private _lineStylesPanelPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _popperShow = false;

  private _forceUpdateSelection() {
    // FIXME: force update selection, because connector mode changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  private _setConnectorMode(mode: ConnectorMode) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.mode !== mode) {
        if (element.mode === ConnectorMode.Orthogonal) {
          const controllers = [
            element.controllers[0],
            element.controllers[element.controllers.length - 1],
          ].map(c => {
            return {
              ...c,
              x: c.x + element.x,
              y: c.y + element.y,
            };
          });

          this.surface.updateElement<'connector'>(element.id, {
            controllers,
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

          this.surface.updateElement<'connector'>(element.id, {
            controllers: route,
            mode,
          });
        }
      }
    });
    this._forceUpdateSelection();
  }

  private _setConnectorColor(color: CssVariableName) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.color !== color) {
        this.surface.updateElement<'connector'>(element.id, { color });
      }
    });
  }

  private _setShapeStrokeWidth(lineWidth: number) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'connector'>(ele.id, {
        lineWidth,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'connector'>(ele.id, {
        strokeStyle,
      });
    });
    this._forceUpdateSelection();
  }

  private _setShapeStyles({ type, value }: LineStylesPanelClickedButton) {
    if (type === 'size') {
      const strokeWidth = value === 's' ? 4 : 10;
      this._setShapeStrokeWidth(strokeWidth);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setShapeStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setShapeStrokeStyle(StrokeStyle.Dashed);
          break;
        }
        case 'none': {
          this._setShapeStrokeStyle(StrokeStyle.None);
          break;
        }
      }
    }
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorPanelPopper = createButtonPopper(
      this._colorButton,
      this._colorPanel
    );
    _disposables.add(this._colorPanelPopper);

    this._lineStylesPanelPopper = createButtonPopper(
      this._lineStylesButton,
      this._lineStylesPanel,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._lineStylesPanelPopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedColor = getMostCommonColor(this.elements);
    const style = {
      backgroundColor: `var(${selectedColor})`,
    };

    const selectedMode = getMostCommonMode(this.elements);
    const selectedLineSize = getMostCommonLineWidth(this.elements) ?? 's';
    const selectedLineStyle = getMostCommonLineStyle(this.elements) ?? 'solid';

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Straight line'}
        .tipPosition=${'bottom'}
        @click=${() => this._setConnectorMode(ConnectorMode.Straight)}
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
        .tipPosition=${'bottom'}
        @click=${() => this._setConnectorMode(ConnectorMode.Orthogonal)}
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
        class="connector-color-button"
        .tooltip=${'Color'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._colorPanelPopper?.toggle()}
      >
        <div>
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

      <edgeless-tool-icon-button
        class="line-styles-button"
        .tooltip=${this._popperShow ? '' : 'Border style'}
        .tipPosition=${'bottom'}
        .active=${false}
        @click=${() => this._lineStylesPanelPopper?.toggle()}
      >
        ${LineStyleIcon}
      </edgeless-tool-icon-button>
      ${LineStylesPanel({
        selectedLineSize,
        selectedLineStyle,
        lineStyle: ['solid', 'dash'],
        onClick: event => {
          this._setShapeStyles(event);
        },
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-connector-button': EdgelessChangeConnectorButton;
  }
}
