import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { REFERENCE_NODE } from '../reference-node.js';
import type { AffineTextSchema } from './types.js';

export const attributeRenderer: AffineTextSchema['textRenderer'] =
  () => delta => {
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
      // https://github.com/toeverything/blocksuite/issues/2136
      return html`${repeat(
        Array.from(delta.insert).map((_, index) => ({
          delta: {
            insert: REFERENCE_NODE,
            attributes,
          },
          index,
        })),
        item => item.index,
        item => html`<affine-reference .delta=${item.delta}></affine-reference>`
      )}`;
    }

    return defaultTemplate;
  };
