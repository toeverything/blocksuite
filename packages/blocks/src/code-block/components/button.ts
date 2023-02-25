import { customElement, property } from 'lit/decorators.js';

import { IconButton } from '../../components/button.js';

@customElement('code-block-button')
export class CodeBlockButton extends IconButton {
  @property()
  width: string | number = '100px';

  @property()
  height: string | number = '32px';

  @property()
  fontSize: string | number = '16px';
}

declare global {
  interface HTMLElementTagNameMap {
    'code-block-button': CodeBlockButton;
  }
}
