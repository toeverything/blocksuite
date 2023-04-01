import type { AttributeRenderer } from '@blocksuite/virgo';
import { html } from 'lit';

import type { AffineTextAttributes } from './types.js';

export const attributeRenderer: AttributeRenderer<
  AffineTextAttributes
> = delta => {
  if (delta?.attributes?.link) {
    return html`<affine-link .delta=${delta}></affine-link>`;
  }

  if (delta?.attributes?.reference) {
    return html`<affine-reference .delta=${delta}></affine-reference>`;
  }

  return html`<affine-text .delta=${delta}></affine-text>`;
};
