import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BaseArrtiubtes, DeltaInsert } from '../types.js';
import { styleMap } from 'lit/directives/style-map.js';
import { VirgoUnitText } from './virgo-unit-text.js';
import { ZERO_WIDTH_SPACE } from '../constant.js';

function virgoTextStyles(props: BaseArrtiubtes): ReturnType<typeof styleMap> {
  return styleMap({
    'white-space': 'break-spaces',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': props.underline
      ? 'underline'
      : props.strikethrough
      ? 'line-through'
      : 'none',
  });
}

@customElement('v-text')
export class BaseText extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<BaseArrtiubtes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      type: 'base',
    },
  };

  render() {
    const unitText = new VirgoUnitText();
    unitText.delta = this.delta;

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span
      data-virgo-element="true"
      style=${virgoTextStyles(this.delta.attributes)}
      >${unitText}</span
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-text': BaseText;
  }
}
