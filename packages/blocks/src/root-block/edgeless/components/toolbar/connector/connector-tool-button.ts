import '../../buttons/toolbar-button.js';
import './connector-menu.js';

import { css, html, LitElement } from 'lit';
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
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';
import { ToolbarButtonWithMenuMixin } from '../mixins/toolbar-button-with-menu.mixin.js';
import type { EdgelessConnectorMenu } from './connector-menu.js';

@customElement('edgeless-connector-tool-button')
export class EdgelessConnectorToolButton extends QuickToolMixin(
  ToolbarButtonWithMenuMixin<
    EdgelessConnectorMenu,
    'connector',
    readonly ['mode', 'stroke', 'strokeWidth']
  >(LitElement)
) {
  static styles = css`
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
  accessor mode: ConnectorMode = ConnectorMode.Curve;

  @state()
  accessor stroke = DEFAULT_CONNECTOR_COLOR;

  @state()
  accessor strokeWidth = LineWidth.Two;

  override type = 'connector' as const;

  override _type = 'connector' as const;

  protected override readonly _states = [
    'mode',
    'stroke',
    'strokeWidth',
  ] as const;

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    const menu = this.createPopper('edgeless-connector-menu', this, {
      onDispose: () => (this._menu = null),
    });
    this._menu = menu;
    menu.element.edgeless = this.edgeless;
    menu.element.onChange = (props: Record<string, unknown>) => {
      this.edgeless.service.editPropsStore.record(this._type, props);
      this.updateMenu();
      this.setEdgelessTool({
        type: this._type,
        mode: this.mode,
      });
    };
    this.updateMenu();
  }

  override render() {
    const { active } = this;
    const arrowColor = active ? 'currentColor' : 'var(--affine-icon-secondary)';
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Straight ', 'C')}
        .tooltipOffset=${17}
        .active=${active}
        .iconContainerPadding=${6}
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
