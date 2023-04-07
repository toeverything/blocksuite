import { html } from 'lit';

import type { BlockHost } from '../../index.js';
import type { AffineTextSchema } from './types.js';

export const attributeRenderer: AffineTextSchema['textRenderer'] =
  (host: BlockHost) => delta => {
    const defaultTemplate = html`<affine-text
      .host=${host}
      .delta=${delta}
    ></affine-text>`;
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
      return html`<affine-link .host=${host} .delta=${delta}></affine-link>`;
    }
    if (attributes.reference) {
      return html`<affine-reference
        .host=${host}
        .delta=${delta}
      ></affine-reference>`;
    }

    return defaultTemplate;
  };
