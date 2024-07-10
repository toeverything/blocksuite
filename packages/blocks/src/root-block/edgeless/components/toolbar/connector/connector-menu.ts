import '../../panel/one-row-color-panel.js';
import '../common/slide-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  ConnectorCWithArrowIcon,
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
} from '../../../../../_common/icons/index.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import type { EdgelessTool } from '../../../types.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

function ConnectorModeButtonGroup(
  mode: ConnectorMode,
  setConnectorMode: (props: Record<string, unknown>) => void
) {
  /**
   * There is little hacky on rendering tooltip.
   * We don't want either tooltip overlap the top button or tooltip on left.
   * So we put the lower button's tooltip as the first element of the button group container
   */
  return html`
    <div class="connector-mode-button-group">
      <edgeless-tool-icon-button
        .active=${mode === ConnectorMode.Curve}
        .activeMode=${'background'}
        .tooltip=${'Curve'}
        @click=${() => setConnectorMode({ mode: ConnectorMode.Curve })}
      >
        ${ConnectorCWithArrowIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .active=${mode === ConnectorMode.Orthogonal}
        .activeMode=${'background'}
        .tooltip=${'Elbowed'}
        @click=${() => setConnectorMode({ mode: ConnectorMode.Orthogonal })}
      >
        ${ConnectorXWithArrowIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .active=${mode === ConnectorMode.Straight}
        .activeMode=${'background'}
        .tooltip=${'Straight'}
        @click=${() => setConnectorMode({ mode: ConnectorMode.Straight })}
      >
        ${ConnectorLWithArrowIcon}
      </edgeless-tool-icon-button>
    </div>
  `;
}

@customElement('edgeless-connector-menu')
export class EdgelessConnectorMenu extends EdgelessToolbarToolMixin(
  LitElement
) {
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
  `;

  override type: EdgelessTool['type'] = 'connector';

  @property({ attribute: false })
  accessor mode!: ConnectorMode;

  @property({ attribute: false })
  accessor stroke!: string;

  @property({ attribute: false })
  accessor strokeWidth!: number;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;

  override render() {
    const { stroke, strokeWidth } = this;
    const connectorModeButtonGroup = ConnectorModeButtonGroup(
      this.mode,
      this.onChange
    );

    return html`
      <edgeless-slide-menu>
        <div class="connector-submenu-content">
          ${connectorModeButtonGroup}
          <div class="submenu-divider"></div>
          <edgeless-line-width-panel
            .selectedSize=${strokeWidth}
            @select=${(e: LineWidthEvent) =>
              this.onChange({ strokeWidth: e.detail })}
          >
          </edgeless-line-width-panel>
          <div class="submenu-divider"></div>
          <edgeless-one-row-color-panel
            .value=${stroke}
            @select=${(e: ColorEvent) => this.onChange({ stroke: e.detail })}
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
