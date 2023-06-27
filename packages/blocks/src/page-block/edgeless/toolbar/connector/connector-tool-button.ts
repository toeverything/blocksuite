import '../../components/tool-icon-button.js';
import './connector-menu.js';

import { EdgelessConnectorIcon } from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../__internal__/index.js';
import { GET_DEFAULT_LINE_COLOR } from '../../components/color-panel.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
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
  computePosition(reference, menu, {
    placement: 'top',
    middleware: [
      offset({
        mainAxis: 10,
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(menu.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
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

    edgeless-tool-icon-button svg {
      transition: 0.2s ease-in-out;
    }

    edgeless-tool-icon-button:hover svg {
      transform: translateY(-8px);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private _menu: ConnectorMenuPopper | null = null;

  private iconButtonStyles = `
    --hover-color: transparent;
  `;

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
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .tooltip=${'Connector'}
        .active=${type === 'connector'}
        .activeMode=${'background'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
            color: GET_DEFAULT_LINE_COLOR(),
          });
          this._toggleMenu();
        }}
      >
        ${EdgelessConnectorIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-tool-button': EdgelessConnectorToolButton;
  }
}
