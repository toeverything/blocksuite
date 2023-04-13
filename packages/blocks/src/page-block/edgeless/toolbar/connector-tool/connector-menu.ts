import '../../components/color-panel.js';
import '../../components/tool-icon-button.js';

import { ConnectorLIcon, ConnectorXIcon } from '@blocksuite/global/config';
import type { Color } from '@blocksuite/phasor';
import { ConnectorMode } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import { tooltipStyle } from '../../../../components/tooltip/tooltip.js';
import type { ColorEvent } from '../../components/color-panel.js';
import { getTooltipWithShortcut } from '../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

function ConnectorModeButtonGroup(
  mouseMode: MouseMode,
  setConnectorMode: (mode: ConnectorMode) => void
) {
  if (mouseMode.type !== 'connector') return nothing;

  const { mode } = mouseMode;
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
      width: 260px;
      z-index: 1;
    }
    .container {
      display: flex;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
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
      background-color: var(--affine-hover-background);
    }

    .connector-mode-button div {
      border-radius: 50%;
      background-color: #888a9e;
    }

    menu-divider {
      height: 62px;
    }

    ${tooltipStyle}
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _setConnectorColor = (color: Color) => {
    if (this.mouseMode.type !== 'connector') return;

    const { mode } = this.mouseMode;
    this.edgeless.slots.mouseModeUpdated.emit({
      type: 'connector',
      color,
      mode,
    });
  };

  private _setConnectorMode = (mode: ConnectorMode) => {
    if (this.mouseMode.type !== 'connector') return;

    const { color } = this.mouseMode;
    this.edgeless.slots.mouseModeUpdated.emit({
      type: 'connector',
      color,
      mode,
    });
  };

  override render() {
    if (this.mouseMode.type !== 'connector') return nothing;

    const { color } = this.mouseMode;
    const brushSizeButtonGroup = ConnectorModeButtonGroup(
      this.mouseMode,
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
