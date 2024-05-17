import '../../buttons/toolbar-button.js';
import './connector-menu.js';

import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowUpIcon,
  ConnectorIcon,
} from '../../../../../_common/icons/index.js';
import { LineWidth } from '../../../../../_common/utils/index.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import { DEFAULT_CONNECTOR_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper } from '../common/create-popper.js';
import { EdgelessToolButton } from '../edgeless-toolbar-button.js';
import type { EdgelessConnectorMenu } from './connector-menu.js';

@customElement('edgeless-connector-tool-button')
export class EdgelessConnectorToolButton extends EdgelessToolButton<
  EdgelessConnectorMenu,
  'connector',
  readonly ['mode', 'stroke', 'strokeWidth']
> {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-connector-button {
      display: flex;
      position: relative;
    }
    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

  @state()
  mode: ConnectorMode = ConnectorMode.Curve;

  @state()
  stroke = DEFAULT_CONNECTOR_COLOR;

  @state()
  strokeWidth = LineWidth.Two;

  protected override _type = 'connector' as const;
  protected override readonly _states = [
    'mode',
    'stroke',
    'strokeWidth',
  ] as const;

  private _toggleMenu() {
    if (this._menu) {
      this._disposeMenu();
      this.requestUpdate();
    } else {
      this._menu = createPopper('edgeless-connector-menu', this, {
        x: 50,
        y: -40,
      });

      this._menu.element.edgeless = this.edgeless;
      this.updateMenu();
      this._menu.element.onChange = (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.record(this._type, props);
      };
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (this._states.some(key => changedProperties.has(key))) {
      if (this._menu) {
        this.updateMenu();
        this.edgeless.tools.setEdgelessTool({
          type: this._type,
          mode: this.mode,
        });
      }
    }
  }

  override render() {
    const { active } = this;
    const arrowColor = active ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Straight ', 'C')}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${8}
        class="edgeless-connector-button"
        @click=${() => {
          this.edgeless.tools.setEdgelessTool({
            type: 'connector',
            mode: this.mode,
          });
          this._toggleMenu();
        }}
      >
        ${ConnectorIcon}
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-tool-button': EdgelessConnectorToolButton;
  }
}
