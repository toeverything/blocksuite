import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('ai-panel-divider')
export class AIPanelDivider extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      align-self: stretch;
      width: 100%;
    }
    .divider {
      height: 0.5px;
      background: #e3e2e4;
      width: 100%;
    }
  `;

  override render() {
    return html`<div class="divider"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-divider': AIPanelDivider;
  }
}
