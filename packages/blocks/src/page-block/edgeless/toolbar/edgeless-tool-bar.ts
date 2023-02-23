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
import { Signal } from '@blocksuite/store';
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

    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      color: var(--affine-line-number-color);
      margin-right: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      border-radius: 5px;
    }

    .icon-container:first-child {
      margin-left: 8px;
    }

    .icon-container:hover {
      background: #f7f7f7;
    }

    .icon-container[clicked] {
      color: var(--affine-primary-color);
    }

    .icon-container[disabled] {
      cursor: not-allowed;
      color: var(--affine-disable-color);
    }

    arrow-tool-tip {
      transform: translateX(-50%) translateY(-50%);
      left: calc(50%);
      bottom: 24px;
      opacity: 0;
    }

    .icon-container:not([clicked]):hover > arrow-tool-tip {
      opacity: 1;
      transition-delay: 200ms;
    }
  `;

  readonly signals = {
    select: new Signal<MouseMode>(),
  };

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  secondaryToolBar: HTMLElement | null = null;

  private _cleanSecondaryToolBar() {
    if (this.secondaryToolBar) {
      this.secondaryToolBar.remove();
      this.secondaryToolBar = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanSecondaryToolBar();
  }

  render() {
    return html`
      <div class="edgeless-toolbar-container">
        <edgeless-tool-icon-button
          .disabled=${false}
          .tooltips=${'Select'}
          .active=${false}
          @tool.click=${() => console.log('Select')}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Text'}
          .active=${false}
          .tool.click=${() => console.log('Text')}
        >
          ${TextIconLarge}
        </edgeless-tool-icon-button>
        <edgeless-shape-tool-button></edgeless-shape-tool-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Image'}
          .active=${false}
          .tool.click=${() => console.log('Image')}
        >
          ${ImageIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Connector'}
          .active=${false}
          .tool.click=${() => console.log('Connector')}
        >
          ${ConnectorIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Pen'}
          .active=${false}
          .tool.click=${() => console.log('Pen')}
        >
          ${PenIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .disabled=${true}
          .tooltips=${'Hand'}
          .active=${false}
          .tool.click=${() => console.log('Hand')}
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
