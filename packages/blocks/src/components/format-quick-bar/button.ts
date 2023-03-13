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

  private readonly _mousedown = (e: MouseEvent) => {
    // prevents catching or bubbling in editor-container
    e.stopPropagation();
    // disable default behavior (e.g., change selection focus)
    e.preventDefault();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mousedown', this._mousedown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('mousedown', this._mousedown);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'format-bar-button': FormatBarButton;
  }
}
