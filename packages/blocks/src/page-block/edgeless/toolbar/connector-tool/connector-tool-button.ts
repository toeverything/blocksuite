import '../../components/tool-icon-button.js';
import './connector-menu.js';

import { ConnectorIcon } from '@blocksuite/global/config';
import { ConnectorMode } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { createPopper } from '@popperjs/core';
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
  const popper = createPopper(reference, menu, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ],
  });

  return {
    element: menu,
    dispose: () => {
      menu.remove();
      popper.destroy();
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

  private _trySetConnectorMode() {
    if (this.mouseMode.type === 'connector') return;

    this.edgeless.slots.mouseModeUpdated.emit({
      type: 'connector',
      mode: ConnectorMode.Orthogonal,
      color: DEFAULT_SELECTED_COLOR,
    });
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
          this._trySetConnectorMode();
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
