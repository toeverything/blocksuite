import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ZERO_WIDTH_SPACE } from '../constant.js';
import type { BaseArrtiubtes, DeltaInsert } from '../types.js';

@customElement('virgo-unit-text')
export class VirgoUnitText extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<BaseArrtiubtes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      type: 'base',
    },
  };

  render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the sync problem about the cursor position
    return html`<span data-virgo-text="true">${this.delta.insert}</span>`;
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
