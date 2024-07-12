import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';

import {
  ArrowUpIcon,
  ConnectorIcon,
} from '../../../../../_common/icons/index.js';
import { LineWidth } from '../../../../../_common/utils/index.js';
import { getConnectorModeName } from '../../../../../surface-block/element-model/connector.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import '../../buttons/toolbar-button.js';
import { DEFAULT_CONNECTOR_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import {
  applyLastProps,
  observeLastProps,
} from '../common/observe-last-props.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';
import './connector-menu.js';

@customElement('edgeless-connector-tool-button')
export class EdgelessConnectorToolButton extends QuickToolMixin(LitElement) {
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

  override type = 'connector' as const;

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    const menu = this.createPopper('edgeless-connector-menu', this);
    menu.element.edgeless = this.edgeless;
    menu.element.onChange = (props: Record<string, unknown>) => {
      this.edgeless.service.editPropsStore.recordLastProps(this.type, props);
      this.updateMenu();
      this.setEdgelessTool({
        mode: this.states.mode!,
        type: this.type,
      });
    };
    this.updateMenu();
  }

  override connectedCallback() {
    super.connectedCallback();
    const { edgeless, stateKeys, states, type } = this;

    applyLastProps(edgeless.service, type, stateKeys, states);

    this.disposables.add(
      observeLastProps(
        edgeless.service,
        type,
        stateKeys,
        states,
        updates => (this.states = { ...this.states, ...updates })
      )
    );
  }

  override render() {
    const { active } = this;
    const arrowColor = active ? 'currentColor' : 'var(--affine-icon-secondary)';
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this.popper
          ? ''
          : getTooltipWithShortcut(
              getConnectorModeName(this.states.mode!),
              'C'
            )}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${6}
        class="edgeless-connector-button"
        @click=${() => {
          // don't update tool before toggling menu
          this._toggleMenu();
          this.edgeless.tools.setEdgelessTool({
            mode: this.states.mode!,
            type: 'connector',
          });
        }}
      >
        ${ConnectorIcon}
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }

  updateMenu() {
    if (!this.popper) return;
    Object.assign(this.popper.element, this.states);
  }

  get stateKeys() {
    return Object.keys(this.states) as Array<keyof typeof this.states>;
  }

  @state()
  accessor states: Partial<LastProps['connector']> = {
    mode: ConnectorMode.Curve,
    stroke: DEFAULT_CONNECTOR_COLOR,
    strokeWidth: LineWidth.Two,
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-tool-button': EdgelessConnectorToolButton;
  }
}
