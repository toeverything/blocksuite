import './affine-text.js';
import '../link-node/affine-link.js';

import type { AttributesRenderer } from '@blocksuite/virgo';
import { html } from 'lit';

import type { AffineTextAttributes } from './types.js';

export const attributesRenderer: AttributesRenderer<AffineTextAttributes> = (
  unitText,
  attributes
) => {
  if (attributes?.link) {
    return html`<affine-link
      .unitText=${unitText}
      .textAttributes=${attributes}
    ></affine-link>`;
  }

  if (attributes) {
    return html`<affine-text
      .unitText=${unitText}
      .textAttributes=${attributes}
    ></affine-text>`;
  } else {
    return html`<affine-text .unitText=${unitText}></affine-text>`;
  }
};
