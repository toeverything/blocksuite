import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-separator')
export class AffineSeparator extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;

      width: 4px;
    }

    :host::after {
      content: '';
      display: flex;
      width: 0.5px;
      height: 100%;
      background-color: var(--affine-border-color);
    }

    :host([data-orientation='horizontal']) {
      height: var(--height, 4px);
      width: unset;
    }

    :host([data-orientation='horizontal'])::after {
      height: 0.5px;
      width: 100%;
    }
  `;
}

export function renderSeparator() {
  return html`<affine-separator></affine-separator>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-separator': AffineSeparator;
  }
}
