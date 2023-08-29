import '../../buttons/toolbar-button.js';
import './connector-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { ConnectorMode } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../__internal__/index.js';
import { EdgelessConnectorIcon } from '../../../../../icons/index.js';
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
    edgeless-toolbar-button svg {
      transition: 0.3s ease-in-out;
    }
    edgeless-toolbar-button:hover svg {
      transform: scale(1.15);
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
        x: 110,
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

    return html`
      <edgeless-toolbar-button
        .tooltip=${this._connectorMenu ? '' : 'Connector'}
        .active=${type === 'connector'}
        .activeMode=${'background'}
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
        ${EdgelessConnectorIcon}
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-tool-button': EdgelessConnectorToolButton;
  }
}
