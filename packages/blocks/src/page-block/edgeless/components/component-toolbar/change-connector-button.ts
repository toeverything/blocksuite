import '../buttons/tool-icon-button.js';
import '../panel/color-panel.js';

import { countBy, DisposableGroup, maxBy } from '@blocksuite/global/utils';
import type { ConnectorElement, SurfaceManager } from '@blocksuite/phasor';
import { StrokeStyle } from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import { LineWidth } from '../../../../__internal__/utils/types.js';
import {
  ConnectorLIcon,
  ConnectorXIcon,
  LineStyleIcon,
} from '../../../../icons/index.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { lineSizeButtonStyles } from '../buttons/line-size-button.js';
import type { LineStyleButtonProps } from '../buttons/line-style-button.js';
import type { EdgelessToolIconButton } from '../buttons/tool-icon-button.js';
import {
  type ColorEvent,
  ColorUnit,
  type EdgelessColorPanel,
  GET_DEFAULT_LINE_COLOR,
} from '../panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../panel/line-styles-panel.js';
import { createButtonPopper } from '../utils.js';

function getMostCommonColor(elements: ConnectorElement[]): CssVariableName {
  const colors = countBy(elements, (ele: ConnectorElement) => ele.stroke);
  const max = maxBy(Object.entries(colors), ([k, count]) => count);
  return max ? (max[0] as CssVariableName) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonMode(elements: ConnectorElement[]): ConnectorMode | null {
  const modes = countBy(elements, (ele: ConnectorElement) => ele.mode);
  const max = maxBy(Object.entries(modes), ([k, count]) => count);
  return max ? (Number(max[0]) as ConnectorMode) : null;
}

function getMostCommonLineWidth(elements: ConnectorElement[]): LineWidth {
  const sizes = countBy(elements, (ele: ConnectorElement) => {
    return ele.strokeWidth;
  });
  const max = maxBy(Object.entries(sizes), ([k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.LINE_WIDTH_FOUR;
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

      .line-style-panel {
        display: none;
      }
      .line-style-panel[data-show] {
        display: flex;
      }
    `,
  ];

  @property({ attribute: false })
  elements: ConnectorElement[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
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

  private _setConnectorMode(mode: ConnectorMode) {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (element.mode !== mode) {
        this.surface.updateElement<'connector'>(element.id, {
          mode,
        });
      }
    });
  }

  private _setConnectorColor(stroke: CssVariableName) {
    this.page.captureSync();

    let shouldUpdate = false;
    this.elements.forEach(element => {
      if (element.stroke !== stroke) {
        shouldUpdate = true;
        this.surface.updateElement<'connector'>(element.id, { stroke });
      }
    });
    if (shouldUpdate) this.requestUpdate();
  }

  private _setConnectorStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'connector'>(ele.id, {
        strokeWidth,
      });
    });
  }

  private _setConnectorStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.surface.updateElement<'connector'>(ele.id, {
        strokeStyle,
      });
    });
  }

  private _setConnectorStyles({ type, value }: LineStylesPanelClickedButton) {
    if (type === 'size') {
      const strokeWidth = value;
      this._setConnectorStrokeWidth(strokeWidth);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setConnectorStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setConnectorStrokeStyle(StrokeStyle.Dashed);
          break;
        }
        case 'none': {
          this._setConnectorStrokeStyle(StrokeStyle.None);
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
    const selectedMode = getMostCommonMode(this.elements);
    const selectedLineSize =
      getMostCommonLineWidth(this.elements) ?? LineWidth.LINE_WIDTH_FOUR;
    const selectedLineStyle = getMostCommonLineStyle(this.elements) ?? 'solid';

    return html`
      <edgeless-tool-icon-button
        class="straight-line-button"
        .tooltip=${'Straight'}
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
        .tooltip=${'Elbowed'}
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
        ${ColorUnit(selectedColor)}
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
          this._setConnectorStyles(event);
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
