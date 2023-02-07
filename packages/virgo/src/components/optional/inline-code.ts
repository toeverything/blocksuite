import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ZERO_WIDTH_SPACE } from '../../constant.js';
import type { BaseArrtiubtes, DeltaInsert } from '../../types.js';
import { VirgoUnitText } from '../virgo-unit-text.js';

export interface InlineCodeAttributes {
  type: 'inline-code';
}

@customElement('v-inline-code')
export class InlineCode extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<InlineCodeAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      type: 'inline-code',
    },
  };

  render() {
    const unitText = new VirgoUnitText();
    const textDelta: DeltaInsert<BaseArrtiubtes> = {
      insert: this.delta.insert,
      attributes: {
        type: 'base',
      },
    };

    unitText.delta = textDelta;

    return html`<code data-virgo-element="true"
      ><span contentEditable="false">${ZERO_WIDTH_SPACE}</span>${unitText}<span
        contentEditable="false"
        >${ZERO_WIDTH_SPACE}</span
      ></code
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-inline-code': InlineCode;
  }
}
