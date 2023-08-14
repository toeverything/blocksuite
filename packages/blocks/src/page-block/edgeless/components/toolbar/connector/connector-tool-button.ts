import '../../buttons/toolbar-button.js';
import './connector-menu.js';

import { ConnectorMode } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  LineWidth,
} from '../../../../../__internal__/index.js';
import { EdgelessConnectorIcon } from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { GET_DEFAULT_LINE_COLOR } from '../../panel/color-panel.js';
import type { EdgelessConnectorMenu } from './connector-menu.js';

interface ConnectorMenuPopper {
  element: EdgelessConnectorMenu;
  dispose: () => void;
}

function createConnectorMenuPopper(
  reference: HTMLElement
): ConnectorMenuPopper {
  const menu = document.createElement('edgeless-connector-menu');
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(menu);

  // The connector menu should be positioned at the top of the connector button.
  // And it should be positioned at the top center of the toolbar all the time.
  const x = 92;
  const y = -44;

  Object.assign(menu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });

  return {
    element: menu,
    dispose: () => {
      menu.remove();
    },
  };
}

@customElement('edgeless-connector-tool-button')
export class EdgelessConnectorToolButton extends LitElement {
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

  private _menu: ConnectorMenuPopper | null = null;

  private _toggleMenu() {
    if (this._menu) {
      this._menu.dispose();
      this._menu = null;
    } else {
      this._menu = createConnectorMenuPopper(this);
      this._menu.element.edgelessTool = this.edgelessTool;
      this._menu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'connector') {
        this._menu?.dispose();
        this._menu = null;
      }
      if (this._menu) {
        this._menu.element.edgelessTool = this.edgelessTool;
        this._menu.element.edgeless = this.edgeless;
      }
    }
  }

  override disconnectedCallback() {
    this._menu?.dispose();
    this._menu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        .tooltip=${'Connector'}
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
