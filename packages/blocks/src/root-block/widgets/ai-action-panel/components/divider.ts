import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('ai-action-panel-divider')
export class AIActionPanelDivider extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      padding: 12px 0px 4px 0px;
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
    'ai-action-panel-divider': AIActionPanelDivider;
  }
}
