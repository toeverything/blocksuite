import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';

@customElement('v-text')
export class VText extends LitElement {
  @property({ attribute: false })
  accessor str: string = ZERO_WIDTH_SPACE;

  @property({ attribute: false })
  accessor styles: StyleInfo = {
    'word-break': 'break-all',
    'white-space': 'pre-wrap',
    'white-space-collapse': 'preserve',
    cursor: 'text',
  };

  override render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    return html`<span style=${styleMap(this.styles)} data-v-text="true"
      >${this.str}</span
    >`;
  }

  override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-text': VText;
  }
}
