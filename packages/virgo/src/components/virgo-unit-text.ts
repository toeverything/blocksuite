import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../constant.js';

const unitTextStyles = styleMap({
  whiteSpace: 'break-spaces',
});

@customElement('virgo-unit-text')
export class VirgoUnitText extends LitElement {
  @property()
  str: string = ZERO_WIDTH_SPACE;

  render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    return html`<span style=${unitTextStyles} data-virgo-text="true"
      >${this.str}</span
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virgo-unit-text': VirgoUnitText;
  }
}
