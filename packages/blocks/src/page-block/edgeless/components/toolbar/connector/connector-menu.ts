import '../../panel/color-panel.js';
import '../../buttons/tool-icon-button.js';

import { ConnectorLIcon, ConnectorXIcon } from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import { tooltipStyle } from '../../../../../components/tooltip/tooltip.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';

function ConnectorModeButtonGroup(
  edgelessTool: EdgelessTool,
  setConnectorMode: (mode: ConnectorMode) => void
) {
  if (edgelessTool.type !== 'connector') return nothing;

  const { mode } = edgelessTool;
  const straightLineTooltip = getTooltipWithShortcut('Straight line', 'L');
  const orthogonalTooltip = getTooltipWithShortcut('Connector', 'X');
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
        ${ConnectorLIcon}
        <tool-tip inert role="tooltip" tip-position="top" arrow>
          ${straightLineTooltip}
        </tool-tip>
      </div>

      <div
        class="connector-mode-button"
        ?active=${mode === ConnectorMode.Orthogonal}
        @click=${() => setConnectorMode(ConnectorMode.Orthogonal)}
      >
        ${ConnectorXIcon}
      </div>
    </div>
  `;
}

@customElement('edgeless-connector-menu')
export class EdgelessConnectorMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      height: 76px;
      width: 260px;
      z-index: 1;
    }
    .container {
      display: flex;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .connector-mode-button-group {
      display: flex;
      flex-direction: column;
    }

    .connector-mode-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      border-radius: 4px;
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

    menu-divider {
      height: 62px;
    }

    ${tooltipStyle}
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private _setConnectorColor = (color: CssVariableName) => {
    if (this.edgelessTool.type !== 'connector') return;

    const { mode } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'connector',
      color,
      mode,
    });
  };

  private _setConnectorMode = (mode: ConnectorMode) => {
    if (this.edgelessTool.type !== 'connector') return;

    const { color } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'connector',
      color,
      mode,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'connector') return nothing;

    const { color } = this.edgelessTool;
    const brushSizeButtonGroup = ConnectorModeButtonGroup(
      this.edgelessTool,
      this._setConnectorMode
    );

    return html`
      <div class="container">
        ${brushSizeButtonGroup}
        <menu-divider .vertical=${true}></menu-divider>
        <edgeless-color-panel
          .value=${color}
          @select=${(e: ColorEvent) => this._setConnectorColor(e.detail)}
        ></edgeless-color-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-menu': EdgelessConnectorMenu;
  }
}
