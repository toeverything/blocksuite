import './tool-icon-button.js';
import './shape-tool-button/shape-tool-button.js';

import {
  ConnectorIcon,
  HandIcon,
  ImageIcon,
  PenIcon,
  SelectIcon,
  TextIconLarge,
} from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-toolbar')
export class EdgelessToolBar extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      z-index: 1;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      justify-content: center;
      transform: translateX(-50%);
    }

    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
      fill: currentColor;
    }

    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }

    .edgeless-toolbar-container[hidden] {
      display: none;
    }
  `;

  @property()
  mouseMode?: MouseMode;

  @property()
  edgeless?: EdgelessPageBlockComponent;

  private _setMouseMode(mouseMode: MouseMode) {
    this.edgeless?.signals.mouseModeUpdated.emit(mouseMode);
  }

  render() {
    const type = this.mouseMode?.type;

    return html`
      <div class="edgeless-toolbar-container">
        <edgeless-tool-icon-button
          .tooltips=${'Select'}
          .active=${type === 'default'}
          @tool.click=${() => this._setMouseMode({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Text'}
          .active=${false}
          @tool.click=${() => console.log('Text')}
        >
          ${TextIconLarge}
        </edgeless-tool-icon-button>
        <edgeless-shape-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
        ></edgeless-shape-tool-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Image'}
          .active=${false}
          @tool.click=${() => console.log('Image')}
        >
          ${ImageIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Connector'}
          .active=${false}
          @tool.click=${() => console.log('Connector')}
        >
          ${ConnectorIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Pen'}
          .active=${false}
          @tool.click=${() => console.log('Pen')}
        >
          ${PenIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Hand'}
          .active=${false}
          @tool.click=${() => console.log('Hand')}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolBar;
  }
}
