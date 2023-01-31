import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IconButton } from '../button.js';

@customElement('format-bar-button')
export class FormatBarButton extends IconButton {
  static styles = css`
    ${IconButton.styles}

    :host {
      width: var(--button-width);
      height: var(--button-height);
      fill: var(--affine-icon-color);
      white-space: nowrap;
    }
  `;

  @property()
  width: string | number = '32px';

  @property()
  height: string | number = '32px';

  // TODO update color when active
  @property()
  active = false;

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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'format-bar-button': FormatBarButton;
  }
}
