import '../../components/tool-icon-button.js';
import './connector-menu.js';

import { ConnectorIcon } from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import { DEFAULT_SELECTED_COLOR } from '../../components/color-panel.js';
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
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  setMouseMode!: (mouseMode: MouseMode) => void;

  private _menu: ConnectorMenuPopper | null = null;

  private _toggleMenu() {
    if (this._menu) {
      this._menu.dispose();
      this._menu = null;
    } else {
      this._menu = createConnectorMenuPopper(this);
      this._menu.element.mouseMode = this.mouseMode;
      this._menu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      if (this.mouseMode.type !== 'connector') {
        this._menu?.dispose();
        this._menu = null;
      }
      if (this._menu) {
        this._menu.element.mouseMode = this.mouseMode;
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
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Connector'}
        .active=${type === 'connector'}
        @click=${() => {
          this.setMouseMode({
            type: 'connector',
            mode: ConnectorMode.Orthogonal,
            color: DEFAULT_SELECTED_COLOR,
          });
          this._toggleMenu();
        }}
      >
        ${ConnectorIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-tool-button': EdgelessConnectorToolButton;
  }
}
