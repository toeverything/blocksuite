import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// FIXME: horizontal
@customElement('menu-divider')
export class MenuDivider extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }

    .divider {
      background-color: var(--affine-border-color);
    }

    .divider.vertical {
      width: 1px;
      height: 100%;
      margin: 0 7px;
    }

    .divider.horizontal {
      width: 100%;
      height: 1px;
      margin: 7px 0;
    }
  `;

  @property({ attribute: false })
  vertical = false;

  override render() {
    return html`<div
      class="divider ${this.vertical ? 'vertical' : 'horizontal'}"
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'menu-divider': MenuDivider;
  }
}
