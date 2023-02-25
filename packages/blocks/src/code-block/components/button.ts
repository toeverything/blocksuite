import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { IconButton } from '../../components/button.js';

// TODO reuse existing button component
@customElement('code-block-button')
export class CodeBlockButton extends LitElement {
  static styles = css`
    ${IconButton.styles}
    :host {
      width: var(--button-width);
      height: var(--button-height);
      fill: var(--affine-icon-color);
    }
  `;

  @property()
  width: string | number = '100px';

  @property()
  height: string | number = '32px';

  @property()
  fontSize: string | number = '16px';

  override connectedCallback() {
    super.connectedCallback();

    this.style.setProperty(
      '--button-width',
      typeof this.width === 'string' ? this.width : `${this.width}px`
    );
    this.style.setProperty(
      '--button-height',
      typeof this.height === 'string' ? this.height : `${this.height}px`
    );
    this.style.setProperty(
      'font-size',
      typeof this.fontSize === 'string' ? this.fontSize : `${this.fontSize}px`
    );
  }

  render() {
    return html` <slot></slot> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'code-block-button': CodeBlockButton;
  }
}
