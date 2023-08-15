import '../../panel/one-row-color-panel.js';
import '../common/slide-menu.js';

import { ConnectorMode } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  type LineWidth,
} from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import { tooltipStyle } from '../../../../../components/tooltip/tooltip.js';
import {
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
} from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';

const CONNECTOR_SUBMENU_WIDTH = 474;

function ConnectorModeButtonGroup(
  edgelessTool: EdgelessTool,
  setConnectorMode: (mode: ConnectorMode) => void
) {
  if (edgelessTool.type !== 'connector') return nothing;

  const { mode } = edgelessTool;
  const straightLineTooltip = getTooltipWithShortcut('Straight', 'L');
  const orthogonalTooltip = getTooltipWithShortcut('Elbowed', 'X');
  /**
   * There is little hacky on rendering tooltip.
   * We don't want either tooltip overlap the top button or tooltip on left.
   * So we put the lower button's tooltip as the first element of the button group container
   */
  return html`
    <div class="connector-mode-button-group has-tool-tip">
      <!-- This tooltip is for the last button(Thick) -->

      <div
        class="connector-mode-button has-tool-tip"
        ?active=${mode === ConnectorMode.Straight}
        @click=${() => setConnectorMode(ConnectorMode.Straight)}
      >
        ${ConnectorLWithArrowIcon}
        <tool-tip inert role="tooltip" tip-position="top-end" arrow>
          ${straightLineTooltip}
        </tool-tip>
      </div>

      <div
        class="connector-mode-button has-tool-tip"
        ?active=${mode === ConnectorMode.Orthogonal}
        @click=${() => setConnectorMode(ConnectorMode.Orthogonal)}
      >
        ${ConnectorXWithArrowIcon}
        <tool-tip inert role="tooltip" tip-position="top" arrow>
          ${orthogonalTooltip}
        </tool-tip>
      </div>
    </div>
  `;
}

@customElement('edgeless-connector-menu')
export class EdgelessConnectorMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }

    .connector-submenu-container {
      display: flex;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 8px 8px 0 0;
      cursor: default;
    }

    .connector-submenu-content {
      display: flex;
      height: 24px;
      align-items: center;
      justify-content: center;
    }

    .connector-mode-button-group {
      display: flex;
      gap: 14px;
    }

    .connector-mode-button {
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      color: var(--affine-icon-color);
      padding: 2px;
      border-radius: 4px;
      cursor: pointer;
    }

    .connector-mode-button:hover {
      background-color: var(--affine-hover-color);
    }

    .connector-mode-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .connector-mode-button svg {
      fill: var(--affine-icon-color);
    }

    .connector-mode-button[active] svg {
      fill: var(--affine-primary-color);
    }

    .submenu-divider {
      width: 1px;
      height: 24px;
      margin: 0 16px;
      background-color: var(--affine-border-color);
      display: inline-block;
    }

    ${tooltipStyle}

    tool-tip {
      z-index: 12;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private _setConnectorColor = (color: CssVariableName) => {
    if (this.edgelessTool.type !== 'connector') return;

    const { mode, strokeWidth } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'connector',
      color,
      mode,
      strokeWidth,
    });
  };

  private _setConnectorMode = (mode: ConnectorMode) => {
    if (this.edgelessTool.type !== 'connector') return;

    const { color, strokeWidth } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'connector',
      color,
      mode,
      strokeWidth,
    });
  };

  private _setConnectorStrokeWidth = (lineWidth: LineWidth) => {
    if (this.edgelessTool.type !== 'connector') return;

    console.log('strokeWidth: ', lineWidth);

    const { color, mode } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'connector',
      color,
      mode,
      strokeWidth: lineWidth,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'connector') return nothing;

    const { color, strokeWidth } = this.edgelessTool;
    const connectorModeButtonGroup = ConnectorModeButtonGroup(
      this.edgelessTool,
      this._setConnectorMode
    );

    return html`
      <div class="connector-submenu-container">
        <edgeless-slide-menu .menuWidth=${CONNECTOR_SUBMENU_WIDTH}>
          <div class="connector-submenu-content">
            ${connectorModeButtonGroup}
            <div class="submenu-divider"></div>
            <edgeless-line-width-panel
              .selectedSize=${strokeWidth}
              @select=${(e: LineWidthEvent) =>
                this._setConnectorStrokeWidth(e.detail)}
            >
            </edgeless-line-width-panel>
            <div class="submenu-divider"></div>
            <edgeless-one-row-color-panel
              .value=${color}
              @select=${(e: ColorEvent) => this._setConnectorColor(e.detail)}
            ></edgeless-one-row-color-panel>
          </div>
        </edgeless-slide-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-menu': EdgelessConnectorMenu;
  }
}
