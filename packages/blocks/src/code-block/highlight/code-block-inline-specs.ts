import {
  type AffineTextAttributes,
  type InlineSpecs,
  affineInlineSpecsWithoutReference,
} from '@blocksuite/affine-components/rich-text';
import { html } from 'lit';
import { z } from 'zod';

export const codeBlockInlineSpecs: InlineSpecs<AffineTextAttributes>[] = [
  {
    name: 'code-block-unit',
    schema: z.undefined(),
    match: () => true,
    renderer: ({ delta }) => {
      return html`<affine-code-unit .delta=${delta}></affine-code-unit>`;
    },
  },
  ...affineInlineSpecsWithoutReference,
];
