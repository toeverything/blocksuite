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
    <div class="connector-mode-button-group">
      <edgeless-tool-icon-button
        .active=${mode === ConnectorMode.Straight}
        .activeMode=${'background'}
        .iconContainerPadding=${2}
        .tooltip=${straightLineTooltip}
        .tipPosition=${'top-end'}
        @click=${() => setConnectorMode(ConnectorMode.Straight)}
      >
        ${ConnectorLWithArrowIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .active=${mode === ConnectorMode.Orthogonal}
        .activeMode=${'background'}
        .iconContainerPadding=${2}
        .tooltip=${orthogonalTooltip}
        @click=${() => setConnectorMode(ConnectorMode.Orthogonal)}
      >
        ${ConnectorXWithArrowIcon}
      </edgeless-tool-icon-button>
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

    .connector-submenu-content {
      display: flex;
      height: 24px;
      align-items: center;
      justify-content: center;
    }

    .connector-mode-button-group {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
    }

    .connector-mode-button-group > edgeless-tool-icon-button svg {
      fill: var(--affine-icon-color);
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-menu': EdgelessConnectorMenu;
  }
}
