import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ZERO_WIDTH_SPACE } from '../constant.js';
import type { DeltaInsert } from '../types.js';
import { getDefaultAttributeRenderer } from '../utils/attribute-renderer.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';

@customElement('v-element')
export class VirgoElement<
  T extends BaseTextAttributes = BaseTextAttributes
> extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<T> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ type: Function, attribute: false })
  attributeRenderer: (delta: DeltaInsert<T>) => TemplateResult<1> =
    getDefaultAttributeRenderer<T>();

  render() {
    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-virgo-element="true"
      >${this.attributeRenderer(this.delta)}</span
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-element': VirgoElement;
  }
}
