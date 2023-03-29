import './affine-text.js';
import '../link-node/affine-link.js';

import type { AttributesRenderer } from '@blocksuite/virgo';
import { html } from 'lit';

import type { AffineTextAttributes } from './types.js';

export const attributesRenderer: AttributesRenderer<AffineTextAttributes> = (
  vText,
  attributes
) => {
  if (attributes?.link) {
    return html`<affine-link
      .vText=${vText}
      .textAttributes=${attributes}
    ></affine-link>`;
  }

  if (attributes?.reference) {
    return html`<affine-reference
      .vText=${vText}
      .textAttributes=${attributes}
    ></affine-reference>`;
  }

  if (attributes) {
    return html`<affine-text
      .vText=${vText}
      .textAttributes=${attributes}
    ></affine-text>`;
  } else {
    return html`<affine-text .vText=${vText}></affine-text>`;
  }
};
