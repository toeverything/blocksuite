import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DirectiveResult } from 'lit/directive.js';
import { styleMap, type StyleMapDirective } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';

@customElement('v-text')
export class VText extends LitElement {
  static override styles = css`
    v-text {
      word-wrap: break-word;
      white-space: break-spaces;
    }
  `;

  @property()
  str: string = ZERO_WIDTH_SPACE;

  @property()
  styles: DirectiveResult<typeof StyleMapDirective> = styleMap({});

  override render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    return html`<span style=${this.styles} data-virgo-text="true"
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
