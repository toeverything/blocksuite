import '../../buttons/toolbar-button.js';
import './connector-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowUpIcon,
  ConnectorIcon,
} from '../../../../../_common/icons/index.js';
import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../_common/utils/index.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { GET_DEFAULT_LINE_COLOR } from '../../panel/color-panel.js';
import { createPopper, type MenuPopper } from '../common/create-popper.js';
import type { EdgelessConnectorMenu } from './connector-menu.js';

@customElement('edgeless-connector-tool-button')
export class EdgelessConnectorToolButton extends WithDisposable(LitElement) {
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

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private _connectorMenu: MenuPopper<EdgelessConnectorMenu> | null = null;

  private _toggleMenu() {
    if (this._connectorMenu) {
      this._connectorMenu.dispose();
      this._connectorMenu = null;
    } else {
      this._connectorMenu = createPopper('edgeless-connector-menu', this, {
        x: 50,
        y: -40,
      });
      this._connectorMenu.element.edgelessTool = this.edgelessTool;
      this._connectorMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'connector') {
        this._connectorMenu?.dispose();
        this._connectorMenu = null;
      }
      if (this._connectorMenu) {
        this._connectorMenu.element.edgelessTool = this.edgelessTool;
        this._connectorMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(newTool => {
        if (newTool.type !== 'connector') {
          this._connectorMenu?.dispose();
          this._connectorMenu = null;
        }
      })
    );
  }

  override disconnectedCallback() {
    this._connectorMenu?.dispose();
    this._connectorMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;
    const arrowColor = type === 'connector' ? 'currentColor' : '#77757D';
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._connectorMenu ? '' : 'Connector'}
        .tooltipOffset=${17}
        .active=${type === 'connector'}
        .iconContainerPadding=${8}
        class="edgeless-connector-button"
        @click=${() => {
          this.setEdgelessTool({
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
            color: GET_DEFAULT_LINE_COLOR(),
            strokeWidth: LineWidth.LINE_WIDTH_TWO,
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
