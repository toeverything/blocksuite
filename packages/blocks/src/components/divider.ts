import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// FIXME: horizontal
@customElement('common-divider')
export class Divider extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .divider {
      background-color: #e3e2e4;
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

  @property()
  vertical = false;

  render() {
    return html`<div
      class="divider ${this.vertical ? 'vertical' : 'horizontal'}"
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'common-divider': Divider;
  }
}
