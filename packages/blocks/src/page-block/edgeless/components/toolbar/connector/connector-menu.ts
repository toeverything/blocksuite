import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import {
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
} from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import { tooltipStyle } from '../../../../../components/tooltip/tooltip.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';

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
      <tool-tip inert role="tooltip" tip-position="top" arrow>
        ${orthogonalTooltip}
      </tool-tip>

      <div
        class="connector-mode-button has-tool-tip"
        ?active=${mode === ConnectorMode.Straight}
        @click=${() => setConnectorMode(ConnectorMode.Straight)}
      >
        ${ConnectorLWithArrowIcon}
        <tool-tip inert role="tooltip" tip-position="top" arrow>
          ${straightLineTooltip}
        </tool-tip>
      </div>

      <div
        class="connector-mode-button"
        ?active=${mode === ConnectorMode.Orthogonal}
        @click=${() => setConnectorMode(ConnectorMode.Orthogonal)}
      >
        ${ConnectorXWithArrowIcon}
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
    .container {
      display: flex;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      position: relative;
      cursor: default;
    }

    .connector-mode-button-group {
      display: flex;
      padding: 0 4px;
      gap: 8px;
    }

    .connector-mode-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      border-radius: 4px;
      color: var(--affine-icon-color);
      cursor: pointer;
    }

    .connector-mode-button[active],
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

    menu-divider {
      height: 24px;
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

  @property({ attribute: false })
  selectedSize: LineWidth = LineWidth.LINE_WIDTH_FOUR;

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

    const { color } = this.edgelessTool;
    const LineWidthButtonGroup = ConnectorModeButtonGroup(
      this.edgelessTool,
      this._setConnectorMode
    );

    return html`
      <div class="container">
        <edgeless-slide-menu>
          ${LineWidthButtonGroup}
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-line-width-panel
            .selectedSize=${this.selectedSize}
            .hasTooltip=${false}
            @select=${(e: LineWidthEvent) =>
              this._setConnectorStrokeWidth(e.detail)}
          >
          </edgeless-line-width-panel>
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-one-row-color-panel
            .value=${color}
            @select=${(e: ColorEvent) => this._setConnectorColor(e.detail)}
          ></edgeless-one-row-color-panel>
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
