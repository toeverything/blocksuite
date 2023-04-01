import type { AttributeRenderer } from '@blocksuite/virgo';
import { html } from 'lit';

import type { AffineTextAttributes } from './types.js';

export const attributeRenderer: AttributeRenderer<
  AffineTextAttributes
> = delta => {
  const defaultTemplate = html`<affine-text .delta=${delta}></affine-text>`;
  if (!delta.attributes) {
    return defaultTemplate;
  }
  const attributes = delta.attributes;

  if (attributes.link) {
    if (attributes.reference) {
      console.error(
        'Invalid attributes: link and reference cannot be used together',
        delta
      );
    }
    return html`<affine-link .delta=${delta}></affine-link>`;
  }
  if (attributes.reference) {
    return html`<affine-reference .delta=${delta}></affine-reference>`;
  }

  return defaultTemplate;
};
