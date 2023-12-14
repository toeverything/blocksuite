import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';

@customElement('v-text')
export class VText extends LitElement {
  @property({ attribute: false })
  str: string = ZERO_WIDTH_SPACE;

  @property({ attribute: false })
  styles: StyleInfo = {
    'word-wrap': 'break-word',
    'white-space': 'break-spaces',
  };

  private parser = new DOMParser();

  override render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    const parsed = this.parser.parseFromString(
      this.str.replace(/\s/g, '&nbsp;'),
      'text/html'
    );
    const str = parsed.body.textContent || '';
    return html`<span style=${styleMap(this.styles)} data-v-text="true"
      >${str}</span
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
